const mongoose = require('mongoose');
const HistorialEdicion = require('../models/HistorialEdicion');
const { MODELOS, ETIQUETAS_REF } = require('../config/editorModelos');

// Editor "en crudo" de documentos de Mongo: arma la descripción de los campos a
// partir del esquema de Mongoose (más los campos que el documento tiene guardados
// pero el esquema ya no declara), convierte lo que llega del formulario al tipo de
// cada campo y deja en HistorialEdicion el documento tal como estaba en Mongo.

const SOLO_LECTURA = ['_id', 'createdAt', 'updatedAt'];

const error = (mensaje, statusCode, extra = {}) =>
    Object.assign(new Error(mensaje), { statusCode, ...extra });

const leerPath = (obj, path) =>
    path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

// Los ObjectId y las fechas se comparan y se mandan a la vista como texto.
const aPlano = (valor) => (valor === undefined ? undefined : JSON.parse(JSON.stringify(valor)));

const mismoValor = (a, b) => JSON.stringify(aPlano(a) ?? null) === JSON.stringify(aPlano(b) ?? null);

class EditorDatosService {

    getConfig(clave) {
        const conf = MODELOS[clave];
        if (!conf) throw error('No existe un editor para ese modelo.', 404);
        return conf;
    }

    // Documento tal cual está en la colección, sin pasar por el esquema.
    async _crudo(conf, id) {
        return conf.modelo.collection.findOne({ _id: new mongoose.Types.ObjectId(String(id)) });
    }

    // ─── Descripción de campos ──────────────────────────────────────────────

    _describirTipo(tipo, path, conf) {
        switch (tipo.instance) {
            case 'String':
                return tipo.enumValues?.length
                    ? { tipo: 'enum', opciones: tipo.enumValues }
                    : { tipo: 'texto' };
            case 'Number':
                return Array.isArray(tipo.options?.enum)
                    ? { tipo: 'enum', opciones: tipo.options.enum, numerico: true }
                    : { tipo: 'numero' };
            case 'Date':
                return { tipo: 'fecha' };
            case 'Boolean':
                return { tipo: 'booleano' };
            case 'ObjectId': {
                const ref = conf.refs?.[path] || tipo.options?.ref;
                return ref ? { tipo: 'ref', ref } : { tipo: 'objectId' };
            }
            default:
                // Mixed, subdocumentos, Map, etc.: se editan como JSON.
                return { tipo: 'json' };
        }
    }

    // Campos fuera del esquema: el tipo se deduce del valor guardado.
    _describirValor(valor) {
        if (valor instanceof Date) return { tipo: 'fecha' };
        if (valor instanceof mongoose.Types.ObjectId) return { tipo: 'objectId' };
        if (typeof valor === 'number') return { tipo: 'numero' };
        if (typeof valor === 'boolean') return { tipo: 'booleano' };
        if (typeof valor === 'string') return { tipo: 'texto' };
        return { tipo: 'json' };
    }

    // Con `ciieId` (usuario institución) el campo que marca la institución queda de solo lectura.
    describirCampos(conf, crudo = null, ciieId = null) {
        const campos = [];
        const raices = new Set();
        conf.modelo.schema.eachPath((path, tipo) => {
            if (path === '__v') return;
            raices.add(path.split('.')[0]);
            const campo = {
                path,
                requerido: !!tipo.isRequired,
                soloLectura: SOLO_LECTURA.includes(path) || Boolean(ciieId && path === conf.campoCiie)
            };
            if (tipo.instance === 'Array') {
                const item = tipo.embeddedSchemaType || tipo.caster;
                if (tipo.$isMongooseDocumentArray || !item) {
                    Object.assign(campo, { tipo: 'json' });
                } else {
                    Object.assign(campo, { tipo: 'lista', item: this._describirTipo(item, path, conf) });
                }
            } else {
                Object.assign(campo, this._describirTipo(tipo, path, conf));
            }
            campos.push(campo);
        });

        Object.keys(crudo || {})
            .filter(k => k !== '__v' && !raices.has(k))
            .forEach(k => campos.push({ path: k, extra: true, ...this._describirValor(crudo[k]) }));

        return campos;
    }

    // ─── Alcance por institución ────────────────────────────────────────────
    // `ciieId` es la institución del usuario, o null para un admin (ve todo).

    _validarAlcance(conf, ciieId) {
        if (ciieId && !conf.campoCiie) throw error('Este modelo solo lo puede editar un administrador.', 403);
    }

    // Un documento de otra institución se trata como inexistente (no se confirma que exista).
    _asegurarDelCiie(conf, crudo, ciieId) {
        if (!crudo || (ciieId && String(crudo[conf.campoCiie] ?? '') !== String(ciieId))) {
            throw error('No se encontró el documento.', 404);
        }
    }

    _filtroRef(ref, ciieId) {
        const campo = ciieId && ETIQUETAS_REF[ref]?.filtroCiie;
        return campo ? { [campo]: new mongoose.Types.ObjectId(String(ciieId)) } : {};
    }

    // Una institución no puede apuntar a un cargo (u otra referencia) de otra institución.
    async _refPermitida(ref, valor, ciieId) {
        const Modelo = mongoose.models[ref];
        if (!ciieId || !Modelo || !ETIQUETAS_REF[ref]?.filtroCiie) return true;
        return Boolean(await Modelo.exists({ _id: valor, ...this._filtroRef(ref, ciieId) }));
    }

    // Opciones de los desplegables de referencias: { Cargo: [{ id, etiqueta }], ... }
    async opcionesRefs(campos, ciieId = null) {
        const refs = new Set(campos.map(c => c.ref || c.item?.ref).filter(Boolean));
        const opciones = {};
        for (const ref of refs) {
            const Modelo = mongoose.models[ref];
            if (!Modelo) continue; // sin modelo registrado: la vista muestra un campo de texto
            const def = ETIQUETAS_REF[ref];
            const docs = await Modelo.find(this._filtroRef(ref, ciieId)).select(def?.select || '').lean();
            opciones[ref] = docs
                .map(d => ({ id: String(d._id), etiqueta: def ? def.etiqueta(d) : (d.nombre || d.clave || String(d._id)) }))
                .sort((a, b) => String(a.etiqueta).localeCompare(String(b.etiqueta), 'es'));
        }
        return opciones;
    }

    // ─── Lectura ────────────────────────────────────────────────────────────

    async listar(clave, ciieId = null) {
        const conf = this.getConfig(clave);
        this._validarAlcance(conf, ciieId);
        const filtro = ciieId ? { [conf.campoCiie]: new mongoose.Types.ObjectId(String(ciieId)) } : {};
        let query = conf.modelo.find(filtro).sort({ updatedAt: -1 });
        (conf.populate || []).forEach(p => { query = query.populate(p); });
        const docs = await query.lean();
        return docs.map(d => ({
            id: String(d._id),
            celdas: conf.columnas.map(col => leerPath(d, col.path))
        }));
    }

    async getParaEditar(clave, id, ciieId = null) {
        const conf = this.getConfig(clave);
        this._validarAlcance(conf, ciieId);
        if (!mongoose.isValidObjectId(id)) throw error('Id inválido.', 400);
        const crudo = await this._crudo(conf, id);
        this._asegurarDelCiie(conf, crudo, ciieId);

        const campos = this.describirCampos(conf, crudo, ciieId);
        const [opciones, historial] = await Promise.all([
            this.opcionesRefs(campos, ciieId),
            this.getHistorial(clave, id)
        ]);
        return { conf, campos, valores: aPlano(crudo), opciones, historial, etiqueta: conf.etiqueta(crudo) };
    }

    async comparar(clave, id, ciieId = null) {
        const conf = this.getConfig(clave);
        this._validarAlcance(conf, ciieId);
        if (!conf.comparador) throw error('Este modelo no tiene comparación con el sitio oficial.', 404);
        if (!mongoose.isValidObjectId(id)) throw error('Id inválido.', 400);
        this._asegurarDelCiie(conf, await this._crudo(conf, id), ciieId);
        return conf.comparador(id);
    }

    async getHistorial(clave, id) {
        const entradas = await HistorialEdicion.find({ modelo: clave, docId: id })
            .sort({ fecha: -1 }).limit(30).lean();
        return entradas.map(h => ({
            id: String(h._id),
            fecha: h.fecha,
            accion: h.accion,
            usuario: h.usuario,
            cambios: (h.cambios || []).map(path => ({
                path,
                antes: aPlano(leerPath(h.antes, path)),
                despues: aPlano(leerPath(h.despues, path))
            }))
        }));
    }

    // ─── Escritura ──────────────────────────────────────────────────────────

    _convertir(campo, valor) {
        if (campo.tipo === 'lista') {
            if (!Array.isArray(valor)) throw new Error('Se esperaba una lista.');
            return valor.map(v => this._convertir(campo.item, v)).filter(v => v !== undefined);
        }
        if (campo.tipo === 'json') {
            if (valor === '' || valor == null) return null;
            try { return JSON.parse(valor); } catch { throw new Error('JSON inválido.'); }
        }
        if (campo.tipo === 'booleano') return valor === true || valor === 'true';

        // En el resto, vaciar el campo lo borra del documento.
        if (valor === '' || valor == null) return undefined;
        switch (campo.tipo) {
            case 'numero': {
                const n = Number(valor);
                if (!Number.isFinite(n)) throw new Error('No es un número.');
                return n;
            }
            case 'enum':
                return campo.numerico ? Number(valor) : String(valor);
            case 'fecha': {
                const f = new Date(valor);
                if (isNaN(f)) throw new Error('Fecha inválida.');
                return f;
            }
            case 'ref':
            case 'objectId':
                if (!mongoose.isValidObjectId(valor)) throw new Error('Id inválido.');
                // Fuera del esquema nadie lo castea: se guarda como ObjectId de entrada.
                return campo.extra ? new mongoose.Types.ObjectId(String(valor)) : valor;
            default:
                return String(valor);
        }
    }

    // `valores` trae solo los campos que cambiaron en el formulario: { path: valor }.
    // `versionCliente` es el updatedAt con el que se abrió el formulario.
    async guardar(clave, id, valores, versionCliente, usuario, ciieId = null) {
        const conf = this.getConfig(clave);
        this._validarAlcance(conf, ciieId);
        if (!mongoose.isValidObjectId(id)) throw error('Id inválido.', 400);
        const antes = await this._crudo(conf, id);
        this._asegurarDelCiie(conf, antes, ciieId);
        const doc = await conf.modelo.findById(id);
        if (!doc) throw error('No se encontró el documento.', 404);

        if (versionCliente && antes.updatedAt && new Date(antes.updatedAt).toISOString() !== versionCliente) {
            throw error('Alguien modificó este documento mientras lo tenías abierto. Recargá la página para ver la versión actual.', 409);
        }

        const errores = {};
        const cambios = [];
        const extraSet = {};
        const extraUnset = {};

        for (const campo of this.describirCampos(conf, antes, ciieId)) {
            if (campo.soloLectura || !Object.prototype.hasOwnProperty.call(valores || {}, campo.path)) continue;
            try {
                const nuevo = this._convertir(campo, valores[campo.path]);
                if (mismoValor(leerPath(antes, campo.path), nuevo)) continue;
                const ref = campo.ref || campo.item?.ref;
                if (ref && ciieId) {
                    for (const v of [].concat(nuevo ?? [])) {
                        if (!(await this._refPermitida(ref, v, ciieId))) throw new Error('Ese valor pertenece a otra institución.');
                    }
                }
                if (campo.extra) {
                    // Mongoose descarta lo que no está en el esquema: va directo a la colección.
                    if (nuevo === undefined) extraUnset[campo.path] = '';
                    else extraSet[campo.path] = nuevo;
                } else {
                    doc.set(campo.path, nuevo);
                    if (campo.tipo === 'json') doc.markModified(campo.path);
                }
                cambios.push(campo.path);
            } catch (e) {
                errores[campo.path] = e.message;
            }
        }

        if (Object.keys(errores).length) throw error('Hay campos con errores.', 400, { errores });
        if (!cambios.length) return { sinCambios: true };

        if (doc.isModified()) {
            await this._guardarValidando(doc);
        } else {
            extraSet.updatedAt = new Date();
        }
        if (Object.keys(extraSet).length || Object.keys(extraUnset).length) {
            const ops = {};
            if (Object.keys(extraSet).length) ops.$set = extraSet;
            if (Object.keys(extraUnset).length) ops.$unset = extraUnset;
            await conf.modelo.collection.updateOne({ _id: antes._id }, ops);
        }

        // En el historial va la diferencia real en Mongo: al guardar, Mongoose también
        // completa los valores por defecto de los campos que faltaban.
        const despues = await this._crudo(conf, id);
        await HistorialEdicion.create({
            modelo: clave, docId: antes._id, accion: 'edicion',
            cambios: this._diferencias(conf, antes, despues), antes, despues, usuario
        });
        return { cambios, version: new Date(despues.updatedAt).toISOString() };
    }

    // Vuelve el documento exactamente a como estaba en Mongo antes del cambio
    // `historialId`. No pasa por las validaciones del esquema: es un estado que
    // ya existió en la base (y puede tener campos que el esquema ya no declara).
    async restaurar(clave, historialId, usuario, ciieId = null) {
        const conf = this.getConfig(clave);
        if (!mongoose.isValidObjectId(historialId)) throw error('Id inválido.', 400);
        const entrada = await HistorialEdicion.findOne({ _id: historialId, modelo: clave }).lean();
        if (!entrada?.antes) throw error('No se encontró ese cambio en el historial.', 404);

        this._validarAlcance(conf, ciieId);
        const antes = await this._crudo(conf, entrada.docId);
        // Tanto el documento actual como la versión a restaurar tienen que ser de la institución.
        this._asegurarDelCiie(conf, antes, ciieId);
        this._asegurarDelCiie(conf, entrada.antes, ciieId);

        await conf.modelo.collection.replaceOne(
            { _id: antes._id },
            { ...entrada.antes, _id: antes._id, updatedAt: new Date() }
        );
        const despues = await this._crudo(conf, entrada.docId);
        const cambios = this._diferencias(conf, antes, despues);

        await HistorialEdicion.create({
            modelo: clave, docId: antes._id, accion: 'restauracion', cambios, antes, despues, usuario
        });
        return { cambios };
    }

    // Campos (del esquema o fuera de él) que difieren entre dos versiones crudas.
    _diferencias(conf, antes, despues) {
        const paths = new Set([
            ...this.describirCampos(conf, antes).map(c => c.path),
            ...this.describirCampos(conf, despues).map(c => c.path)
        ]);
        return [...paths].filter(p => !SOLO_LECTURA.includes(p) && !mismoValor(leerPath(antes, p), leerPath(despues, p)));
    }

    async _guardarValidando(doc) {
        try {
            await doc.save();
        } catch (e) {
            if (e instanceof mongoose.Error.ValidationError) {
                const errores = Object.fromEntries(Object.entries(e.errors).map(([p, er]) => [p, er.message]));
                throw error('Mongo rechazó los datos.', 400, { errores });
            }
            throw e;
        }
    }
}

module.exports = new EditorDatosService();
