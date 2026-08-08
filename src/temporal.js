<div class='form-group'>
					<label for='apelnom' class='col-sm-2 control-label'>Apellido:</label>
					<div class='col-sm-6'>
						<span id="04" class="error">Dato obligatorio</span>
						<input onblur="ocultar()" type='text' size='60' maxlength='60' class='form-control' id='apelnom' name='apelnom' placeholder='Apellido' required>
					</div>
				</div>				

				<div class='form-group'>
					<label for='nombre' class='col-sm-2 control-label'>Nombres:</label>
					<div class='col-sm-6'>
						<span id="05" class="error">Dato obligatorio</span>
						<input onblur="ocultar()" type='text' size='60' maxlength='60' class='form-control' id='nombres' name='nombres' placeholder='Nombres'  required>
						
					</div>
				</div>								

				<div class='form-group' hidden="">
					<label for='domicilio' class='col-sm-2 control-label'>Domicilio:</label>
					<div class='col-sm-6'>
						<span id="06" class="error">Dato obligatorio</span>
						<input onblur="ocultar()" type='text' size='60' maxlength='60' class='form-control' id='domicilio' name='domicilio' placeholder='Ingrese su domicilio' required>
					</div>
				</div>				

				<div class='form-group' hidden="">
					<label for='anioegre' class='col-sm-2 control-label'>Año de Egreso (Título docente y/o Trayecto docente):</label>
					<div class='col-sm-6'>
							<select  onblur="ocultar()"  name="anioegre" id="anioegre">
							<option value='0'>Seleccione una Opción</option><option value='2026'>2026</option><option value='2025'>2025</option><option value='2024'>2024</option><option value='2023'>2023</option><option value='2022'>2022</option><option value='2021'>2021</option><option value='2020'>2020</option><option value='2019'>2019</option><option value='2018'>2018</option><option value='2017'>2017</option><option value='2016'>2016</option><option value='2015'>2015</option><option value='2014'>2014</option><option value='2013'>2013</option><option value='2012'>2012</option><option value='2011'>2011</option><option value='2010'>2010</option><option value='2009'>2009</option><option value='2008'>2008</option><option value='2007'>2007</option><option value='2006'>2006</option><option value='2005'>2005</option><option value='2004'>2004</option><option value='2003'>2003</option><option value='2002'>2002</option><option value='2001'>2001</option><option value='2000'>2000</option><option value='1999'>1999</option><option value='1998'>1998</option><option value='1997'>1997</option><option value='1996'>1996</option><option value='1995'>1995</option><option value='1994'>1994</option><option value='1993'>1993</option><option value='1992'>1992</option><option value='1991'>1991</option><option value='1990'>1990</option><option value='1989'>1989</option><option value='1988'>1988</option><option value='1987'>1987</option><option value='1986'>1986</option><option value='1985'>1985</option><option value='1984'>1984</option><option value='1983'>1983</option><option value='1982'>1982</option><option value='1981'>1981</option><option value='1980'>1980</option><option value='1979'>1979</option><option value='1978'>1978</option><option value='1977'>1977</option><option value='1976'>1976</option><option value='1975'>1975</option><option value='1974'>1974</option><option value='1973'>1973</option><option value='1972'>1972</option><option value='1971'>1971</option><option value='1970'>1970</option><option value='1969'>1969</option><option value='1968'>1968</option><option value='1967'>1967</option><option value='1966'>1966</option><option value='1965'>1965</option><option value='1964'>1964</option><option value='1963'>1963</option><option value='1962'>1962</option><option value='1961'>1961</option><option value='1960'>1960</option><option value='1959'>1959</option><option value='1958'>1958</option><option value='1957'>1957</option><option value='1956'>1956</option><option value='1955'>1955</option><option value='1954'>1954</option><option value='1953'>1953</option><option value='1952'>1952</option><option value='1951'>1951</option><option value='1950'>1950</option><option value='1949'>1949</option><option value='1948'>1948</option><option value='1947'>1947</option><option value='1946'>1946</option><option value='1945'>1945</option><option value='1944'>1944</option><option value='1943'>1943</option><option value='1942'>1942</option><option value='1941'>1941</option><option value='1940'>1940</option><option value='1939'>1939</option><option value='1938'>1938</option><option value='1937'>1937</option><option value='1936'>1936</option><option value='1935'>1935</option><option value='1934'>1934</option><option value='1933'>1933</option><option value='1932'>1932</option><option value='1931'>1931</option><option value='1930'>1930</option><option value='1929'>1929</option><option value='1928'>1928</option><option value='1927'>1927</option><option value='1926'>1926</option><option value='1925'>1925</option><option value='1924'>1924</option><option value='1923'>1923</option><option value='1922'>1922</option><option value='1921'>1921</option><option value='1920'>1920</option><option value='1919'>1919</option><option value='1918'>1918</option><option value='1917'>1917</option><option value='1916'>1916</option><option value='1915'>1915</option><option value='1914'>1914</option><option value='1913'>1913</option><option value='1912'>1912</option><option value='1911'>1911</option><option value='1910'>1910</option><option value='1909'>1909</option><option value='1908'>1908</option><option value='1907'>1907</option><option value='1906'>1906</option><option value='1905'>1905</option><option value='1904'>1904</option><option value='1903'>1903</option><option value='1902'>1902</option><option value='1901'>1901</option>							</select>
							<span id="07" class="error">Dato obligatorio</span>							

					</div>
				</div>				
				
				<div class="form-group" id="divcuil">			
				
					<label  for="cuil" class="col-sm-2 control-label">CUIL (Puede obtener su CUIL <a href="https://www.anses.gob.ar/consulta/constancia-de-cuil" target="_blanck">AQUI</a>):</label>
					
					<div class="col-sm-3">
  						
						<input onblur="ocultar()" type="text" maxlength="11" size="11" id="cuil" name="cuil"  Placeholder="99999999999" required> <span id="08" class="error">Dato obligatorio</span> Sólo números
					</div>
				</div>				

						
				<div class='form-group' hidden="">
					<label for='telefono' class='col-sm-2 control-label'>Teléfono de contacto:</label>
					<div class='col-sm-2'>
						<span id="09" class="error">Dato obligatorio</span>
						<input onblur="ocultar()" type='text' size='6' maxlength='6' class='form-control' id='codarea' name='codarea' placeholder='Código de Área' required>

					</div>
					
					<div class='col-sm-2'>
						<span id="10" class="error">Dato obligatorio</span>
						<input onblur="ocultar()" type='text' size='5' maxlength='10' class='form-control' id='telefono' name='telefono' placeholder='Teléfono' required>
					</div>
				</div>												
				
				<div class='form-group' hidden="">
					<label for='fechanac' class='col-sm-2 control-label'>Fecha de nacimiento:</label>
					<div class='col-sm-6'>
						
						<input onblur="ocultar()" type='date'  id='fechanac' name='fechanac'  required><span id="11" class="error">Dato obligatorio</span><span style="color: #0939ED">&nbsp;Puede cambiar el año haciendo clic en el año del calendario</span>
					</div>
				</div>

				<div class='form-group' hidden="">
					<label for='cbx_cargo' class='col-sm-2 control-label'>Cargos (Señale todas las opciones que correspondan): </label>
					<div class='col-sm-6'>

						<div>
							<span id="16" class="error">Dato obligatorio</span>							
							<div class="col-sm-9" style="padding-left: 10px;">
								<label><input onblur='ocultar()'' type='checkbox' size='40' maxlength='40'  id='cargo[]' name='cargo[]' value='Docente'>&nbspDocente</label><br><label><input onblur='ocultar()'' type='checkbox' size='40' maxlength='40'  id='cargo[]' name='cargo[]' value='Equipo de conducción'>&nbspEquipo de conducción</label><br><label><input onblur='ocultar()'' type='checkbox' size='40' maxlength='40'  id='cargo[]' name='cargo[]' value='Bibliotecario, EMATP'>&nbspBibliotecario, EMATP</label><br><label><input onblur='ocultar()'' type='checkbox' size='40' maxlength='40'  id='cargo[]' name='cargo[]' value='Preceptor'>&nbspPreceptor</label><br><label><input onblur='ocultar()'' type='checkbox' size='40' maxlength='40'  id='cargo[]' name='cargo[]' value='Integrante de EOE'>&nbspIntegrante de EOE</label><br><label><input onblur='ocultar()'' type='checkbox' size='40' maxlength='40'  id='cargo[]' name='cargo[]' value='Inspector/a'>&nbspInspector/a</label><br><label><input onblur='ocultar()'' type='checkbox' size='40' maxlength='40'  id='cargo[]' name='cargo[]' value='Educador/a'>&nbspEducador/a</label><br><label><input onblur='ocultar()'' type='checkbox' size='40' maxlength='40'  id='cargo[]' name='cargo[]' value='Otro'>&nbspOtro</label><br>									
							</div>							
						</div>					
					</div>
				</div>

				<div class='form-group' hidden="">
					<label for='cbx_cargo' class='col-sm-2 control-label'>Nivel/es y Modalidad/es (Señale todas las opciones que correspondan):  </label>
					<div >
						<div class="row">
							<div class="col-sm-3">
								<span id="17" class="error">Dato obligatorio</span>
							</div>
							<div class="col-sm-9" style="padding-left: 30px;">
								<label><input onblur='ocultar()'' type='checkbox' size='40' maxlength='40'  id='opcion[]' name='opcion[]' value='N. Ed. INICIAL'>&nbspN. Ed. INICIAL</label><br><label><input onblur='ocultar()'' type='checkbox' size='40' maxlength='40'  id='opcion[]' name='opcion[]' value='N. Ed. PRIMARIA'>&nbspN. Ed. PRIMARIA</label><br><label><input onblur='ocultar()'' type='checkbox' size='40' maxlength='40'  id='opcion[]' name='opcion[]' value='N. Ed. SECUNDARIA'>&nbspN. Ed. SECUNDARIA</label><br><label><input onblur='ocultar()'' type='checkbox' size='40' maxlength='40'  id='opcion[]' name='opcion[]' value='N. Ed. SUPERIOR'>&nbspN. Ed. SUPERIOR</label><br><label><input onblur='ocultar()'' type='checkbox' size='40' maxlength='40'  id='opcion[]' name='opcion[]' value='MOD. Ed. ARTÍSTICA'>&nbspMOD. Ed. ARTÍSTICA</label><br><label><input onblur='ocultar()'' type='checkbox' size='40' maxlength='40'  id='opcion[]' name='opcion[]' value='MOD. Ed. FÍSICA'>&nbspMOD. Ed. FÍSICA</label><br><label><input onblur='ocultar()'' type='checkbox' size='40' maxlength='40'  id='opcion[]' name='opcion[]' value='MOD. Ed. J, A y AM'>&nbspMOD. Ed. J, A y AM</label><br><label><input onblur='ocultar()'' type='checkbox' size='40' maxlength='40'  id='opcion[]' name='opcion[]' value='MOD. Ed. ESPECIAL'>&nbspMOD. Ed. ESPECIAL</label><br><label><input onblur='ocultar()'' type='checkbox' size='40' maxlength='40'  id='opcion[]' name='opcion[]' value='MOD. PC Y PS'>&nbspMOD. PC Y PS</label><br><label><input onblur='ocultar()'' type='checkbox' size='40' maxlength='40'  id='opcion[]' name='opcion[]' value='MOD. Ed. TÉC. PROFESIONAL (solo Secundaria)'>&nbspMOD. Ed. TÉC. PROFESIONAL (solo Secundaria)</label><br>									
							</div>

						</div>
					</div>
				</div>


				<div class='form-group'>
					<label for='email' class='col-sm-2 control-label'>Email externo (gmail, Hotmail, yahoo, …):</label>
					<div class='col-sm-6'>
						<span id="12" class="error">Dato obligatorio</span>
						<input onblur="ocultar()" type='email' size='100' maxlength='100' class='form-control' id='email' name='email' placeholder='Ingrese su Email' autocomplete="false" readonly onfocus="this.removeAttribute('readonly');" required>
					</div>
				</div>


				<div class='form-group'>
					<div id='noesabc'> <span id='noesabc'></span></div>

				</div>					

				<div class='form-group'>
					<label for='conmail' class='col-sm-2 control-label'>Repetir email Externo:</label>
					<div class='col-sm-6'>
						<span id="13" class="error">Dato obligatorio</span>
						<input onblur="ocultar()" type='email' size='100' maxlength='100' class='form-control' id='conmail' name='conmail' placeholder='Reingrese su Email' readonly onfocus="this.removeAttribute('readonly');" required>
					</div>
				</div>

				<div id="alternativo">
					
					<div class='form-group' hidden="">
						<div id="concouli">
							<label  for='emailalt' class='col-sm-2 control-label'>Email @abc.gob.ar. Completar solo si tiene. Puede consultarlo(<a href="../imagenes/couli1.png" target="_blank">aquí</a>) </label>
						</div>
						
						
						<div class='col-sm-6'>
							<span id="14" class="error">Dato obligatorio</span>
							<input onblur="ocultar()" type='email' size='100' maxlength='100' class='form-control' id='emailalt' name='emailalt' placeholder='Ingrese su Email' readonly onfocus="this.removeAttribute('readonly');" required>

						</div>

					</div>
					<div class='form-group' hidden="">
						<label for='conemailalt' class='col-sm-2 control-label'>Repetir email @abc.gob.ar:</label>
						<div class='col-sm-6'>
							<span id="15" class="error">Dato obligatorio</span>
							<input onblur="ocultar()" type='email' size='100' maxlength='100' class='form-control' id='conemailalt' name='conemailalt' placeholder='Reingrese su Email' readonly onfocus="this.removeAttribute('readonly');" required>
						</div>
					</div>
					
				</div>				
				
				<div class='form-group'>
					<div id='alert' > <span  id='mensajes'></span></div>				
				</div>				
				
				<div class='form-group'>
					<div id='listo'> <span id='listo'></span></div>
					
				</div>								

				

				
				
				<h5 id = 'nopueden'  style='text-align:left' hidden="">Por consultas comunicarse con el CIIE de inscripción a través de los canales habituales (mail, red social, etc.)</b></h5>								

				
				
				
				<div class='form-group'>
					<div class="col-sm-offset-2 col-sm-10">
						
						<button type='submit' id='enviar' class='btn btn-primary'>Inscribirme</button>
				
					</div>
				</div>
				
				<div class='form-group'>
					<div class="col-sm-offset-2 col-sm-10">

						<input type='button' id='refrescar'  style='background-color:gray;color: white;' value='haga clic aquí para comenzar una nueva inscripción' onClick='location.reload();'/>


					</div>
				</div>				
				
				<div class='form-group'>
					<div class="col-sm-offset-2 col-sm-10">
						
						<a href='../form/consulta.php' target="_blank" class='btn btn-success'>Consultar mi inscripción</a>
						
					</div>
				</div>
		<!-- Modal -->
		<div class="modal fullscreen-modal fade" id="confirm-delete" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
			<div class="modal-dialog" role="document">
				<div class="modal-content">
					
					<div class="modal-header">
						<h4 class="modal-title" id="myModalLabel">PIE DE COULI</h4>
					</div>
					
					<div class="modal-body">
						<p align="center">
							<a href="../imagenes/couli.jpg" target="_blank"><img src="../imagenes/couli1.png" alt="" width="100%"></a>click en el ejemplo para ampliar
							
						</p>
						
					</div>
					
					<div class="modal-footer">
						<button type="button" class="btn btn-default" data-dismiss="modal">Cerrar</button>
					</div>
				</div>
			</div>
		</div>

			</form>
		</div>

		<script>
			$(document).ready(function() {
				document.getElementById('refrescar').style.display = 'none';
				/*
				document.getElementById('sincouli').style.display = 'none';
				document.getElementById('concouli').style.display = 'none';
				document.getElementById('alternativo').style.display = 'none';
				document.getElementById('mostrarabc').style.display = 'none';
				*/
				cupo=12;
								if (cupo>0){
									
									$('#cupo').css('color', '#000000');
									$('#cupo').html(cupo);
								}else{
									$('#cupo').css('color', 'red');
									$('#cupo').html('Sin cupo disponible');

								}
				
									
					id_region=$("#cbx_region").val();
					iddirigida=1;
						$.post("getciie.php", { id_region: id_region,iddirigida: iddirigida }, function(data){
							$("#cbx_ciie").html(data);
							
						});            
					$('#cbx_region').prop('disabled', 'true');
					$('#labelregion').html("Región");
				
				
				ocultar();
			});
		</script>

		<script>
			function mostrar(idspan,idcontrol){

				idcontrol='#'+idcontrol;
				document.getElementById(idspan).style.display = 'inline';
				$(idcontrol).focus();
			}

			function ocultar(){
				document.getElementById('01').style.display = 'none';
				document.getElementById('02').style.display = 'none';
				document.getElementById('03').style.display = 'none';
				document.getElementById('04').style.display = 'none';
				document.getElementById('05').style.display = 'none';
				document.getElementById('06').style.display = 'none';
				document.getElementById('07').style.display = 'none';
				document.getElementById('08').style.display = 'none';
				document.getElementById('09').style.display = 'none';
				document.getElementById('10').style.display = 'none';
				document.getElementById('11').style.display = 'none';
				document.getElementById('12').style.display = 'none';
				document.getElementById('13').style.display = 'none';
				document.getElementById('14').style.display = 'none';
				document.getElementById('15').style.display = 'none';
				document.getElementById('16').style.display = 'none';
				document.getElementById('17').style.display = 'none';
				document.getElementById('18').style.display = 'none';
				document.getElementById('19').style.display = 'none';
				document.getElementById('20').style.display = 'none';
			}
		</script>
		
	</body>
</html>