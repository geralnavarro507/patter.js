/*  
    Creado por     : Geral Navarro
    Version        : v19
    Actualización  : 17-09-2022
    Modificado por : Geral Navarro
  
    1. gnavarro 17092022 corrección bug de secuencial antes de solicitar campos requeridos,
                         se modifica funcion f_NuevaSecuencia y se agrega f_Validador para mejora de código
*/
var LaddaLoad;
var Gv_TOOLS;
var Gv_REG_X_GUARDAR;
var Gv_REG_GUARDADOS;
var Gv_LOV_SELECTS = [];
var Gv_LOV_SELECTS2 = [];
var Gv_ESTATUS = 'R';//R: Registro,C: Consulta 

$(document).ready(function() {
  //START DOM
  $('#id_borrar').on('click', function(ev) {
    location.reload();
  });
  $('#id_buscar').on('click', function(ev) {
    if(Gv_TOOLS.filtros && Gv_TOOLS.alertas){
      if(f_ValidaElmRequeridos(Gv_TOOLS.filtros,Gv_TOOLS.alertas)){
        LaddaLoad = Ladda.create(this);
        LaddaLoad.start(); 
        f_BuscarRegistros();
      }
    }else{
      LaddaLoad = Ladda.create(this);
      LaddaLoad.start(); 
      f_BuscarRegistros();
    }
  });
  $('#id_guardar').on('click', function(ev) {
    var Lv_alertado = false; 
    var Lv_elementos = []; 
    var Lv_alertas = []; 
    var Lv_NuevoSecuencial = false;
    if(Gv_TOOLS){
      //se cargan los elementos
      for(var j=0; j<Object.keys(Gv_TOOLS).length; j+=1){ 
        if(Gv_TOOLS["e"+(j+1)]){
          //BUSCA NUEVO SECUENCIAL
          if(Gv_TOOLS["e"+(j+1)].NuevoSecuencial){
            if(!$(Gv_TOOLS["e"+(j+1)].elm).val()){
              Lv_NuevoSecuencial = Gv_TOOLS["e"+(j+1)].elm;
            }
          }
          if(Gv_TOOLS["e"+(j+1)].elm){
            var Lv_Elm = $(Gv_TOOLS["e"+(j+1)].elm);
            Lv_elementos.push(Lv_Elm);
          }
          if(Gv_TOOLS["e"+(j+1)].alerta){
            var Lv_Alert = Gv_TOOLS["e"+(j+1)].alerta;
            Lv_alertas[j] = Lv_Alert;
          }
        }
      }
      if(Lv_NuevoSecuencial){
        var Lv_confirmar = true;
        if(Gv_TOOLS.confirmar_nuevo){
          Lv_msj = ((Gv_TOOLS.alerta_nuevo)?Gv_TOOLS.alerta_nuevo:'Se creará un nuevo registro');
          Lv_confirmar = confirm(Lv_msj);
        }
        if(Lv_confirmar){
          /*if(f_Validador(Lv_elementos,Lv_alertas)){
          LaddaLoad = Ladda.create(this);
          LaddaLoad.start(); 
          f_NuevaSecuencia(Lv_elementos,Lv_NuevoSecuencial);
          }*/
          LaddaLoad = Ladda.create(this);
          LaddaLoad.start(); 
          f_NuevaSecuencia(Lv_elementos,Lv_alertas,Lv_NuevoSecuencial);
        }
      }else{
        //Verifica elementos requeridos para guardar
        if(f_Validador(Lv_elementos,Lv_alertas)){
          if(Gv_TOOLS.guardado){
            LaddaLoad = Ladda.create(this);
            LaddaLoad.start(); 
            f_Guardar();
          }
        }
      }
    }
  });
  $("#id_table1").on("click","button.btn-delete", function(ev) {
    var trValue = $(this).parents('tr');
    //$(trValue).css("display", "none"); ajuste por d-flex
    $(trValue).attr('style', 'display: none !important');
    $(trValue).addClass("table-danger");
    $(trValue).removeClass("table-warning");
  });
  //END DOM
});
function f_BuscarRegistros() {
  $("#id_cantregistros").val("");
  $("#id_tbody1").html('');
  if(Gv_TOOLS){
    
    //Buscar datos de encabezado
    if(Gv_TOOLS.consulta_encabezado){
      Lv_data = {funcion:Gv_TOOLS.consulta_encabezado};
      //se cargan los valores de filtros
      for(var j=0; j<Object.keys(Gv_TOOLS).length; j+=1){
        if(Gv_TOOLS["f"+(j+1)]){
          if(Gv_TOOLS.encodeuri){
            Lv_data["f"+(j+1)] = encodeURIComponent($(Gv_TOOLS["f"+(j+1)]).val())
          }else{
            Lv_data["f"+(j+1)] = ($(Gv_TOOLS["f"+(j+1)]).val());
          }
        }
      }
      var json = $.ajax({
        type: 'post',
        url: 'consultas.php',
        data: Lv_data
      });
      if(Gv_TOOLS.busqueda_multiregistro){
        json.done(function(r) { 
          var Cont = 0;
          var Lv_Row  = [];
          var Lv_Rows = [];
          var Lv_NuevoRegistro = false;
          $.each(r.datos, function(jo,item){
            Cont++;
            Lv_Row  = [];
            for(var j=0; j<Object.keys(Gv_TOOLS).length; j+=1){
              if(Gv_TOOLS["e"+(j+1)]){
                var Lv_Elm = Gv_TOOLS["e"+(j+1)];
                if(Lv_Elm.elm){
                  Lv_Row.push(item["c"+(j+1)]);
                }
                if(Lv_Elm.NuevoSecuencial){
                  Lv_NuevoRegistro = true;
                }
              }
            }
            Lv_Rows.push(Lv_Row);
            if(Cont==2){
              return false; 
            }
          });
          if(LaddaLoad.isLoading()){
            LaddaLoad.stop();
          }
          if(Cont>0){
            if(Cont==1){
              if(Lv_NuevoRegistro==true){
                for(var j=0; j<Object.keys(Gv_TOOLS).length; j+=1){
                  if(Gv_TOOLS["e"+(j+1)]){
                    var Lv_Elm = Gv_TOOLS["e"+(j+1)];
                    if(Lv_Elm.elm){
                      $(Lv_Elm.elm).val(Lv_Row[j]);
                      if(Lv_Elm.control_estatus){
                        Gv_ESTATUS = 'C';//consulta
                      }
                      if(Lv_Elm.select){
                        if(Lv_Elm.select.lov_index){
                          var Lv_LovIndex =Lv_Elm.select.lov_index;
                          var Lv_Options = Gv_LOV_SELECTS[Lv_LovIndex];
                          if(Lv_Options){
                            Lv_Options = Lv_Options.replace("value='"+Lv_Row[j]+"'", "value='"+Lv_Row[j]+"' selected ");//Capturar exection
                            $(Lv_Elm.elm).html(Lv_Options);
                          }
                        }
                      }
                    }
                    if(Lv_Elm.input){
                      if(Lv_Elm.input.type){
                        if(Lv_Elm.input.type=="checkbox"){
                          if(Lv_Row[j]=="S"){
                            $(Lv_Elm.elm).prop('checked', true);
                          }
                        }
                        if(Lv_Elm.input.type=="radio"){
                          if(Lv_Elm.input.numradio){
                            var Lv_RadioNumS = ((Lv_Elm.input.numradio*2)-1);
                            var Lv_RadioNumN = (Lv_Elm.input.numradio*2);
                            if(Lv_Row[j]=="S"){
                              $('#id_Radio'+Lv_RadioNumS).prop('checked', true);
                            }
                            if(Lv_Row[j]=="N"){
                              $('#id_Radio'+Lv_RadioNumN).prop('checked', true);
                            }
                          }
      
                        }
                      }
                    }
                  }
                }
              }
              if(Gv_TOOLS.edc){
                if(Gv_TOOLS.edc.length>0){
                  f_DisabledOnQuery();
                }
              }       
              f_BuscarRegistrosDetalle();
            }else{
              Gv_LOV = {/*c1:Lv_c1, c2:Lv_c2, */title:"SELCCIONE UN REGISTRO", 
                      consulta:(Gv_TOOLS.consulta_encabezado?Gv_TOOLS.consulta_encabezado:false),
                      noiniciar:false}
              for(var j=0; j<Object.keys(Gv_TOOLS).length; j+=1){
                if(Gv_TOOLS["e"+(j+1)]){
                  var Lv_Elm = Gv_TOOLS["e"+(j+1)];
                  if(Lv_Elm.elm){
                    var Lv_FILTRO = false;
                    var Lv_VISIBLE = false;
                    for(var i=0; i<Object.keys(Gv_TOOLS).length; i+=1){
                      if(Gv_TOOLS["f"+(i+1)]){
                        if($(Lv_Elm.elm).attr('id') == $(Gv_TOOLS["f"+(i+1)]).attr('id')){//verifica si el encabezado debe filtrar
                          Lv_FILTRO = true;
                          if(Lv_Elm.title){//solo muestra los que tienen titulo
                            Lv_VISIBLE = true;
                          }
                        }
                      }
                    }
                    Gv_LOV["c"+(j+1)] = {
                      elm:$(Lv_Elm.elm), 
                      display:Lv_VISIBLE,
                      title:(Gv_TOOLS["e"+(j+1)].title?Gv_TOOLS["e"+(j+1)].title:"e"+(j+1)),
                      default_filter:Lv_FILTRO,
                      val:$(Lv_Elm.elm).val()
                    };
                  }
                }
              }
              $('#id_mlov').modal('show');
            }
          }else{
            alert('No se encontraron registros');
          }
        });
        json.fail(function() {
          if(LaddaLoad.isLoading()){
            LaddaLoad.stop();
          }
          $("#id_tbody1").html('');
          alert('Error en la busqueda, debe filtrar mas los datos');
        });
      }else{
        json.done(function(r) {
          $.each(r.datos, function(j,item){
            for(var j=0; j<Object.keys(Gv_TOOLS).length; j+=1){ 
              if(Gv_TOOLS["e"+(j+1)]){
                var Lv_Elm = Gv_TOOLS["e"+(j+1)];
                if(Lv_Elm.elm){
  
                  $(Lv_Elm.elm).val(item["c"+(j+1)]);
                  if(Lv_Elm.control_estatus){
                    Gv_ESTATUS = 'C';//consulta
                    $(Lv_Elm.elm).prop('disabled', true);
                  }
                  if(Lv_Elm.select){
                    if(Lv_Elm.select.lov_index){
                      var Lv_LovIndex =Lv_Elm.select.lov_index;
                      var Lv_Options = Gv_LOV_SELECTS[Lv_LovIndex];
                      if(Lv_Options){
                        Lv_Options = Lv_Options.replace("value='"+item["c"+(j+1)]+"'", "value='"+item["c"+(j+1)]+"' selected ");//Capturar exection
                        $(Lv_Elm.elm).html(Lv_Options);
                      }
                    }
                  }
                }
                if(Lv_Elm.input){
                  if(Lv_Elm.input.type){
                    if(Lv_Elm.input.type=="checkbox"){
                      if(item["c"+(j+1)]=="S"){
                        $(Lv_Elm.elm).prop('checked', true);
                      }
                    }
                    if(Lv_Elm.input.type=="radio"){
                      if(Lv_Elm.input.numradio){
                        var Lv_RadioNumS = ((Lv_Elm.input.numradio*2)-1);
                        var Lv_RadioNumN = (Lv_Elm.input.numradio*2);
                        if(item["c"+(j+1)]=="S"){
                          $('#id_Radio'+Lv_RadioNumS).prop('checked', true);
                        }
                        if(item["c"+(j+1)]=="N"){
                          $('#id_Radio'+Lv_RadioNumN).prop('checked', true);
                        }
                      }
  
                    }
                  }
                }
              }
            }
          });
          if(LaddaLoad.isLoading()){
            LaddaLoad.stop();
          }
          if(Gv_TOOLS.edc){
            if(Gv_TOOLS.edc.length>0){
              f_DisabledOnQuery();
            }
          }
          f_BuscarRegistrosDetalle();
        });
        json.fail(function(r) {
          if(LaddaLoad.isLoading()){
            LaddaLoad.stop();
          }
        });
      }

    //fin encabezado
    }else{
      f_BuscarRegistrosDetalle();
    }
    //$('#id_cantregistros').text(Cont+" Registro(s)");
  }
}

function f_BuscarRegistrosDetalle(){
  if(Gv_TOOLS.consulta){
    var Lv_data = {funcion:Gv_TOOLS.consulta};
    //se cargan los valores de filtros
    for(var j=0; j<Object.keys(Gv_TOOLS).length; j+=1){
      if(Gv_TOOLS["f"+(j+1)]){
        //alert(j);
        //Lv_data["f"+(j+1)] = $(Gv_TOOLS["f"+(j+1)]).val();
        //gnavarro 07072022 se elimina encodeURIComponent por inconveniente en pantallas
        //Lv_data["f"+(j+1)] = encodeURIComponent($(Gv_TOOLS["f"+(j+1)]).val());
        if(Gv_TOOLS.encodeuri){
          Lv_data["f"+(j+1)] = encodeURIComponent($(Gv_TOOLS["f"+(j+1)]).val())
        }else{
          Lv_data["f"+(j+1)] = ($(Gv_TOOLS["f"+(j+1)]).val());
        }
      }
    }
    var json = $.ajax({
      type: 'post',
      url: 'consultas.php',
      data: Lv_data
    });
    json.done(function(r) { 
      var Cont = 0;
      var Lt_Tabla1 = "";
      $.each(r.datos, function(j,item){
        Cont++;
        Lv_trclass = ((Gv_TOOLS.trclass)?' '+Gv_TOOLS.trclass+' ':'');
        Lt_Tabla1 += '<tr class="align-middle '+Lv_trclass+'" style="cursor: pointer; cursor: hand;">';
        for(var j=0; j<Object.keys(Gv_TOOLS).length; j+=1){
          if(Gv_TOOLS["c"+(j+1)]){
            Lv_col = Gv_TOOLS["c"+(j+1)];
            Lv_Visible = ((Lv_col.visible)?'':'style="display: none;" ');
            Lv_Valor = item["c"+(j+1)];
            Lv_TdClass = ((Lv_col.class)?Lv_col.class:'');
            Lv_Class = '';
            if(Lv_col.input){//verifica si es input
              if(Lv_col.input.class){
                for (let k = 0; k < Lv_col.input.class.length; k++) {
                  Lv_Class += ' '+Lv_col.input.class[k];
                }
              }
              Lv_Class = ' class="form-control '+Lv_Class+'" ';
              Lv_Type  = ' type="'+((Lv_col.input.type)?Lv_col.input.type:'text')+'" ';
              Lv_PlaceHolder = ((Lv_col.input.placeholder)?' placeholder="'+Lv_col.input.placeholder+'" ':' ');
              Lv_Style = ((Lv_col.input.style)?' style="'+Lv_col.input.style+'" ':' ');
              Lv_Value = ' value="'+((item["c"+(j+1)])?item["c"+(j+1)]:'')+'"';
              Lv_Disabled = ((Lv_col.input.disabled)?' disabled ':'');
              Lv_Checked = ((Lv_col.input.type)?(Lv_col.input.type=='checkbox'?((((item["c"+(j+1)])?item["c"+(j+1)]:'')=='S')?' checked ':''):''):' ');
              Lv_Valor = '<input '+Lv_Class+Lv_Type+Lv_PlaceHolder+Lv_Style+Lv_Value+Lv_Disabled+Lv_Checked+'>';
            }else{
              if(Lv_col.button){//verifica si es boton
                if(Lv_col.button.class){
                  for (let k = 0; k < Lv_col.button.class.length; k++) {
                    Lv_Class += ' '+Lv_col.button.class[k];
                  }
                }
                Lv_Data_Toggle = ((Lv_col.button.data_toggle)?' data-toggle="'+Lv_col.button.data_toggle+'" ':' ');
                Lv_Data_Target = ((Lv_col.button.data_target)?' data-target="'+Lv_col.button.data_target+'" ':' ');
                Lv_Column_Class = ((Lv_col.button.column_class)?' '+((item["c"+(j+1)])?item["c"+(j+1)]:'')+' ':' ');
                var Lv_IndexColLabel = (Lv_col.button.column_label?item["c"+(j+1)].indexOf("*"):-1);
                Lv_Column_Label = ((Lv_col.button.column_label)?' '+((item["c"+(j+1)])?(Lv_IndexColLabel>-1?item["c"+(j+1)].substring(Lv_IndexColLabel):''):'')+' ':' ');
                Lv_Class = ' class="btn btn-secondary '+Lv_Class+Lv_Column_Class+'" ';
                Lv_Fa = ((Lv_col.button.fa)?Lv_col.button.fa:'fa fa-ellipsis-h');
                Lv_Disabled = ((Lv_col.button.disabled)?' disabled':'');
                Lv_Label = ((Lv_col.button.label)?Lv_col.button.label:' ')+Lv_Column_Label;
                Lv_Style = ((Lv_col.button.style)?' style="'+Lv_col.button.style+'" ':' ');
                Lv_Valor = '<button type="button" '+Lv_Class+Lv_Style+Lv_Disabled+Lv_Data_Toggle+Lv_Data_Target+'><i class="'+Lv_Fa+'"></i>'+Lv_Label+'</button>';
              }else{
                if(Lv_col.select){//verifica si es select
                  if(Lv_col.select.class){
                    for (let k = 0; k < Lv_col.select.class.length; k++) {
                      Lv_Class += ' '+Lv_col.select.class[k];
                    }
                  }
                  Lv_Class = ' class="form-control '+Lv_Class+'" ';
                  Lv_Disabled = ((Lv_col.select.disabled)?' disabled':'');
                  Lv_Style = ((Lv_col.select.style)?' style="'+Lv_col.select.style+'" ':' ');
                  var Lv_LovIndex =((Lv_col.select.lov_index)?Lv_col.select.lov_index:'');
                  var Lv_Options;
                  if(Lv_col.select.d){
                    var Lv_O2 = Gv_LOV_SELECTS2[Lv_LovIndex];
                    var Lv_O3 = Lv_O2[item["c"+(Lv_col.select.d)]];
                    Lv_Options = Lv_O3;
                  }else{
                    if(Lv_col.select.f){
                      var Lv_O2 = Gv_LOV_SELECTS2[Lv_LovIndex];
                      var Lv_CODAREA = $(Lv_col.select.f).val();
                      var Lv_O3 = Lv_O2[Lv_CODAREA];
                      Lv_Options = Lv_O3;
                    }else{
                      Lv_Options = Gv_LOV_SELECTS[Lv_LovIndex];
                    }
                  };
                  if(Lv_Options){
                    Lv_Options = Lv_Options.replace("value='"+item["c"+(j+1)]+"'", "value='"+item["c"+(j+1)]+"' selected ");//Capturar exection
                  }
                  Lv_Valor = '<select '+Lv_Class+Lv_Disabled+Lv_Style+'>'+Lv_Options+'</select>';
                }else{
                  if(Lv_col.radio){
                    LLVal = item["c"+(j+1)];
                    var Lv_O2 = '<div class="form-check form-check-inline">'+
                    '<input class="form-check-input radio-S" type="radio" name="inlineRadioOptions'+'row'+(Cont+1)+'" id="inlineRadio1'+'row'+Cont+'" value="S" '+((LLVal=='S')?' checked ':'')+'>'+
                    '<label class="form-check-label" for="inlineRadio1'+'row'+Cont+'">Si</label>'+
                    '</div>'+
                    '<div class="form-check form-check-inline">'+
                      '<input class="form-check-input radio-N" type="radio" name="inlineRadioOptions'+'row'+(Cont+1)+'" id="inlineRadio2'+'row'+Cont+'" value="N" '+((LLVal=='N')?' checked ':'')+'>'+
                      '<label class="form-check-label" for="inlineRadio2'+'row'+Cont+'">No</label>'+
                    '</div>';
                    Lv_Valor = Lv_O2;
                  }else{
                    if(Lv_col.textarea){
                      if(Lv_col.textarea.class){
                        for (let k = 0; k < Lv_col.textarea.class.length; k++) {
                          Lv_Class += ' '+Lv_col.textarea.class[k];
                        }
                      }
                      Lv_Disabled = ((Lv_col.textarea.disabled)?' disabled ':'');
                      Lv_PlaceHolder = ((Lv_col.textarea.placeholder)?' placeholder="'+Lv_col.textarea.placeholder+'" ':' ');
                      Lv_Class = ' class="form-control '+Lv_Class+'" '
                      Lv_Style = ((Lv_col.textarea.style)?' style="'+Lv_col.textarea.style+'" ':' ');
                      Lv_Value = item["c"+(j+1)];
                      Lv_Valor = '<textarea rows="1" '+Lv_Class+Lv_PlaceHolder+Lv_Disabled+Lv_Style+'>'+Lv_Value+'</textarea>'
                    }
                  }
                }
              }
            }
            Lt_Tabla1 += '<td '+Lv_Visible+' class="align-middle '+Lv_TdClass+'">' + Lv_Valor + '</td>';//columnas
          }
        }
        Lt_Tabla1 += '</tr>';
      });
      if(LaddaLoad.isLoading()){
        LaddaLoad.stop();
      }
      if(Cont>0){
        $("#id_tbody1").html(Lt_Tabla1);
        if ( $(".select2-basico").length ) {
          setTimeout(function (){
            $('.select2-basico').select2({
              width:'100%'
            } );
          }, 100);
        }
      }else{
        if(!Gv_TOOLS.noalerta_tbody){
          alert('No se encontraron registros');
        }
        if( typeof f_PostQuery !== 'undefined' && jQuery.isFunction( f_PostQuery ) ) {
          f_PostQuery();
        }
      }
    });
    json.fail(function() {
      if(LaddaLoad.isLoading()){
        LaddaLoad.stop();
      }
      alert('Error en la busqueda de registros');
    });
  }else{
    if( typeof f_PostQuery !== 'undefined' && jQuery.isFunction( f_PostQuery ) ) {
      f_PostQuery();
    }
  }
}

function f_ValidaElmRequeridos(elementos,alertas) {
  var valido = false;
  var contador = 0;
  var mensaje = "";
  for(var j=0; j<elementos.length; j+=1){
    var Valor = $(elementos[j]).val();
    if(alertas[j]){
      if(Valor){
        contador+=1;
      }else{
        mensaje += ((mensaje.length>0)?'\n':'')+alertas[j];
      }
    }else{
      contador+=1;
    }
  } 
  if(contador==elementos.length){
    valido = true;
  }else{
    alert(mensaje);
  }
  return valido;
}

function f_ValidaDatosEnTabla() {
  var Lv_Respuesta = false; 
  var Lv_CantInvalidos = 0;
  var Lv_tbody = document.getElementById("id_tbody1");
  var Lv_rowLength = Lv_tbody.rows.length;
  var Lv_cellsLength = Lv_tbody.rows[0].cells.length;
  var Lv_input;
  var Mensaje = '';
  var Lv_UltimoInputReq;
  for(var i=0; i<Lv_rowLength; i+=1){
    var row = Lv_tbody.rows[i];
    if($(row).hasClass('table-warning') && (!$(row).hasClass('table-danger'))) {
      for(var j=0; j<Lv_cellsLength; j+=1){
        var Lv_Requeridas = [];
        var Lv_td = $(row.cells[j]);
        if($(Lv_td).has( "input, select" ).length){//si td tiene input o select
          Lv_input = $(row.cells[j]).children();
          if($(Lv_input).attr('required')){
          //if(P_Validar[j]){
            var Lv_cell = $(row.cells[j]).children().val();
            if(!Lv_cell){
              Lv_UltimoInputReq = $(row.cells[j]).children();
              $(Lv_td).addClass("table-danger");
              var Lv_Columnas = $('#id_trth1').children();
              Lv_Requeridas.push(($(Lv_Columnas[j]).html()?$(Lv_Columnas[j]).html():(j+1)));
              Lv_CantInvalidos++;
            }
          }
        }
        if(Lv_Requeridas.length>0){
          var Lv_CR = Lv_Requeridas.toString();
          Lv_CR = Lv_CR.replace('&nbsp;',' ');
          Mensaje += "Las columnas ("+Lv_CR+") fila "+(i+1)+" son requeridas"+'\n';
        } 
      }
    }
  }
  if(Lv_CantInvalidos==0){
    Lv_Respuesta = true;
  }else{
    alert(Mensaje);
    $(Lv_UltimoInputReq).focus();
  }
  if(Gv_TOOLS.antesdeguardar){
    return f_AntesDeGuardar();
  }else{
    return Lv_Respuesta;
  }
}

function f_Guardar(){
  if(Gv_TOOLS.guardado){
    if(Gv_TOOLS.guardado=='detalle'){
      f_GuardarDetalle();
    }else{
      if(Gv_TOOLS.guardado=='encabezado_detalle'){
        f_GuardarEncabezado('SI');//parametro detalle si
      }else{
        if(Gv_TOOLS.guardado=='encabezado'){
          f_GuardarEncabezado('NO');//parametro detalle si
        }
      }
    }
  }
}

function f_GuardarDetalle(){
  Gv_REG_X_GUARDAR = ($('#id_table1 tbody tr.table-warning').length)+($('#id_table1 tbody tr.table-danger').length);
  Gv_REG_GUARDADOS = 0;
  if(Gv_REG_X_GUARDAR==0){
    if(LaddaLoad.isLoading()){
      LaddaLoad.stop();
      alert("Datos Guardados");
    }
  }else{
    var Lv_tbody = document.getElementById("id_tbody1");
    var Lv_rowLength = Lv_tbody.rows.length;
    var Lv_cellsLength = Lv_tbody.rows[0].cells.length;
    for(var i=0; i<Lv_rowLength; i+=1){//recorrer datos
      var row = Lv_tbody.rows[i];
      if($(row).hasClass('table-warning') || $(row).hasClass('table-danger') || $(row).hasClass('table-info')) {//warning update, danger delete, info insert
        var Lv_Registro = 'e='+(($(row).hasClass('table-danger'))?'D':(($(row).hasClass('table-warning'))?'A':'I'));//se agrega estatus actual
        var Lv_Parameter = 1;
        var form_data = new FormData();
        var file_data;
        for(var j=0; j<Lv_cellsLength; j+=1){
          var Lv_td = $(row.cells[j]);
          var Lv_valor = '';
          if($(Lv_td).has( "input, select, textarea" ).length){//si td tiene input o select
            Lv_input = $(row.cells[j]).children();
            Lv_valor = $(row.cells[j]).children().val();
            if($(Lv_td).has( "textarea" ).length){
              var Lv_valor = encodeURIComponent($(row.cells[j]).children().val());
            }
            if($(Lv_input).is(':checkbox')){
              Lv_valor = (($(Lv_input).is(':checked'))?'S':'');
            }
            $(Lv_td).find("input:radio.radio-S").each(function() {
              Lv_valor = (($(this).is(':checked'))?'S':'N');
            });
            $(Lv_td).find("input:radio.radio-N").each(function() {
              Lv_valor = (($(this).is(':checked'))?'N':'S');
            });
            if($(Lv_input).is(':file')){
              file_data = $(Lv_input).prop('files')[0];   
              if(file_data){
                form_data.append('file', file_data);
              }
            }
          }else{
            if(!$(Lv_td).has( "button" ).length){//si td not tiene boton
              Lv_valor = $(Lv_td).text();
            }

          }
          if(Gv_TOOLS["c"+(j+1)]){
            Lv_col = Gv_TOOLS["c"+(j+1)];
            if(Lv_col.guardar){
              Lv_Registro += '&p'+Lv_Parameter+'='+nvl(Lv_valor,'0');
              Lv_Parameter++;
            }
          }
        }
        //Guarda Detalle
        var utl_procesador = (Gv_TOOLS.urldetalle?Gv_TOOLS.urldetalle+'?'+Lv_Registro:'crud_detalle.php?'+Lv_Registro);
        if(!file_data){
          var json = $.ajax({
            type: 'POST',
            dataType: 'json',
            url: utl_procesador,
            jsonpCallback: "ProcesData"
          });
        }else{
          var json = $.ajax({//para registros con columna de archivo
            url: utl_procesador,
            type: 'POST',
            data: form_data,
            contentType: false,
            dataType: 'json',
            cache: false,
            processData:false
          });
        }
        json.done(function(r) {  
          $.each(r.datos, function(j,item){
            if(item.msj!='OK'){
              alert(item.msj);  
            }
          });
          Gv_REG_GUARDADOS++;
          if(f_AlertDatosGuardatos()){
            f_BuscarRegistros();
          };
        });
        json.fail(function(r) {
          Gv_REG_GUARDADOS++;
          if(f_AlertDatosGuardatos()){
            f_BuscarRegistros();
          };
        });
        //Guarda Detalle
      }
    }
  }
}

function nvl(value1,value2) { 
  if (value1 == null || value1 == ''){
    return value2;
  }else{
    return value1;
  }
} 

function f_AlertDatosGuardatos() {
  var Lv_Resultado = false;
  if((Gv_REG_X_GUARDAR)==Gv_REG_GUARDADOS){
    if(Gv_TOOLS.procesoalguardar){
      var utl_procesador = Gv_TOOLS.procesoalguardar;
      var json = $.ajax({
        type: 'POST',
        dataType: 'json',
        url: utl_procesador ,
        jsonpCallback: "ProcesData"
      });
      json.done(function(r) {
        $.each(r.datos, function(j,item){
          if(item.msj!='OK'){
            alert(item.msj);
            if(LaddaLoad.isLoading()){
              LaddaLoad.stop();    
            }
          }
        });
      });
      json.fail(function(r) {
        if(LaddaLoad.isLoading()){
          LaddaLoad.stop();  
        }
        alert('Error al culminar Proceso: '+Gv_TOOLS.procesoalguardar);
      });
    }
    if(Gv_TOOLS){
      if(Gv_TOOLS.borracantregistros){
        $('#id_cantregistros').text('');
      }
    }
    alert('Datos Guardados');
    Lv_Resultado = true;
  }
  return Lv_Resultado;
}

function f_GuardarEncabezado(P_Detalle){//Parametro detalle
  if(Gv_TOOLS){
    var Lv_RegistroEnc = '';
    var Lv_ParameterEnc = 0;
    var form_data = new FormData();
    var file_data;
    //se cargan los valores de encabezado
    for(var j=0; j<Object.keys(Gv_TOOLS).length; j+=1){
      if(Gv_TOOLS["e"+(j+1)]){   
        if(Gv_TOOLS["e"+(j+1)].elm){
          Lv_ParameterEnc++;
          var Lv_valor = encodeURIComponent($(Gv_TOOLS["e"+(j+1)].elm).val());
          var Lv_Elm = Gv_TOOLS["e"+(j+1)];
          if(Lv_Elm.control_estatus){
            Gv_ESTATUS = 'C';//consulta
            $(Lv_Elm.elm).prop('disabled', true);
          }
          if(Gv_TOOLS["e"+(j+1)].input){
            if(Gv_TOOLS["e"+(j+1)].input.type){
              if(Gv_TOOLS["e"+(j+1)].input.type=="radio"){
                if(Lv_Elm.input.numradio){
                  var Lv_RadioNumS = ((Lv_Elm.input.numradio*2)-1);
                  Lv_valor = (($('#id_Radio'+Lv_RadioNumS).is(':checked'))?'S':'N');            
                }
              }
              if(Gv_TOOLS["e"+(j+1)].input.type=="checkbox"){
                Lv_valor = (($(Lv_Elm.elm).is(':checked'))?'S':'N');  
              }
              if(Gv_TOOLS["e"+(j+1)].input.type=="file"){
                file_data = $(Lv_Elm.elm).prop('files')[0];   
                if(file_data){
                  form_data.append('file', file_data);
                }
              }
            }
          }
          Lv_RegistroEnc += '&p'+Lv_ParameterEnc+'='+nvl(Lv_valor,'0');
        }
      }
    }
    var utl_procesador = (Gv_TOOLS.urlencabezado?Gv_TOOLS.urlencabezado+'?e=I'+Lv_RegistroEnc:'crud_encabezado.php?e=I'+Lv_RegistroEnc);
    if(!file_data){
      var json = $.ajax({
        type: 'POST',
        dataType: 'json',
        url: utl_procesador,
        jsonpCallback: "ProcesData"
      });
    }else{
      var json = $.ajax({//para registros con columna de archivo
        url: utl_procesador,
        type: 'POST',
        data: form_data,
        contentType: false,
        dataType: 'json',
        cache: false,
        processData:false
      });
    }
    json.done(function(r) {
      $.each(r.datos, function(j,item){
        if(item.msj!='OK'){
          var Lv_Mensaje = item.msj;   
          var Lv_Ini = Lv_Mensaje.indexOf("ORA-20101: ");
          var Lv_Fin = Lv_Mensaje.indexOf("ORA-06512: ");
          var Lv_Mensaje = Lv_Mensaje.substring(11, Lv_Fin);
          alert(Lv_Mensaje);
          if(LaddaLoad.isLoading()){
            LaddaLoad.stop();    
          }
        }else{
          //inicio
          if(P_Detalle=='SI'){//Guardar detalle
            Gv_REG_X_GUARDAR = ($('#id_table1 tbody tr.table-warning').not('.table-danger').length)+($('#id_table1 tbody tr.table-danger').length);
            Gv_REG_GUARDADOS = 0;
            if(Gv_REG_X_GUARDAR==0){
              if(LaddaLoad.isLoading()){
                LaddaLoad.stop();    
              }
              alert("Datos Guardados");
              f_BuscarRegistros();
            }else{
              var Lv_tbody = document.getElementById("id_tbody1");
              var Lv_rowLength = Lv_tbody.rows.length;
              var Lv_cellsLength = Lv_tbody.rows[0].cells.length;
              for(var i=0; i<Lv_rowLength; i+=1){//recorrer datos
                var row = Lv_tbody.rows[i];
                if($(row).hasClass('table-warning') || $(row).hasClass('table-danger') || $(row).hasClass('table-info')) {//warning update, danger delete, info insert
                  var Lv_Registro = 'e='+(($(row).hasClass('table-danger'))?'D':(($(row).hasClass('table-warning'))?'A':'I'))+Lv_RegistroEnc;//se agrega estatus actual
                  var Lv_Parameter = Lv_ParameterEnc;
                  for(var j=0; j<Lv_cellsLength; j+=1){
                    var Lv_td = $(row.cells[j]);
                    var Lv_valor = '';
                    if($(Lv_td).has( "input, select, textarea" ).length){//si td tiene input o select
                      Lv_input = $(row.cells[j]).children();
                      Lv_valor = $(row.cells[j]).children().val();
                      if($(Lv_td).has( "textarea" ).length){
                        var Lv_valor = encodeURIComponent($(row.cells[j]).children().val());
                      }
                      if($(Lv_input).is(':checkbox')){
                        Lv_valor = (($(Lv_input).is(':checked'))?'S':'');
                      }
                      $(Lv_td).find("input:radio.radio-S").each(function() {
                        Lv_valor = (($(this).is(':checked'))?'S':'N');
                      });
                      $(Lv_td).find("input:radio.radio-N").each(function() {
                        Lv_valor = (($(this).is(':checked'))?'N':'S');
                      });
                      if($(Lv_input).is(':file')){
                        file_data = $(Lv_input).prop('files')[0];   
                        if(file_data){
                          form_data.append('file', file_data);
                        }
                      }
                    }else{
                      if(!$(Lv_td).has( "button" ).length){//si td not tiene boton
                        Lv_valor = $(Lv_td).text();
                      }
                    }
                    if(Gv_TOOLS["c"+(j+1)]){
                      Lv_col = Gv_TOOLS["c"+(j+1)];
                      if(Lv_col.guardar){
                        Lv_Parameter++;
                        Lv_Registro += '&p'+Lv_Parameter+'='+nvl(Lv_valor,'0');                       
                      }
                    }
                  }
                  //Guarda Detalle
                  var utl_procesador = (Gv_TOOLS.urldetalle?Gv_TOOLS.urldetalle+'?'+Lv_Registro:'crud_detalle.php?'+Lv_Registro);
                  var json = $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: utl_procesador ,
                    jsonpCallback: "ProcesData"
                  });
                  json.done(function(r) { 
                    $.each(r.datos, function(j,item){
                      if(item.msj!='OK'){
                        alert(item.msj);  
                      }
                    }); 
                    Gv_REG_GUARDADOS++;
                    if(f_AlertDatosGuardatos()){
                      f_BuscarRegistros();
                    };
                  });
                  json.fail(function(r) {
                    Gv_REG_GUARDADOS++;
                    if(f_AlertDatosGuardatos()){
                      f_BuscarRegistros();
                    };
                  });
                  //Guarda Detalle
                }
              }
            }
          }else{
            if(LaddaLoad.isLoading()){
              LaddaLoad.stop();  
            }
            alert("Datos Guardados");
            if(Gv_TOOLS){
              if(Gv_TOOLS.limpiarpantalla){
                location.reload();
              }else{
                f_BuscarRegistros();
              }
            }
          }
          //fin
        }
      });
    });
    json.fail(function(r) {
      if(LaddaLoad.isLoading()){
        LaddaLoad.stop();  
      }
      alert('Error Al guardar Datos de Encabezado');
    });
  }
}

function f_NuevaSecuencia(Lv_elementos,Lv_alertas,P_Elemento_SEC){
	//Lv_elementos,Lv_alertas
  var Lv_alertado = false;
  /*var Lv_elementos = []; 
  var Lv_alertas = []; */
  Lv_data = {funcion:'QueryNuevaSecuencia'};
  for (let j = 0; j < Lv_elementos.length; j++) {
    Lv_data["f"+(j+1)] = $(Lv_elementos[j]).val();
  }
  var json = $.ajax({
    type: 'post',
    url: 'consultas.php',
    data: Lv_data
  });
  json.done(function(r) { 
    //var Lt_Tabla1 = "";
    //var Ln_Count = 0;
    $.each(r.datos, function(j,item){
      //Ln_Count++;
      if(P_Elemento_SEC && item.c1 != '0'){
        //asigna nuevo secuencial temporalmente
        $(P_Elemento_SEC).val(item.c1);
        if(Gv_TOOLS){
          /*
          //se cargan los elementos
          for(var j=0; j<Object.keys(Gv_TOOLS).length; j+=1){  
            if(Gv_TOOLS["e"+(j+1)]){
              //BUSCA NUEVO SECUENCIAL
              if(Gv_TOOLS["e"+(j+1)].NuevoSecuencial){
                Lv_NuevoSecuencial = Gv_TOOLS["e"+(j+1)].elm;
              }
              if(Gv_TOOLS["e"+(j+1)].elm){
                var Lv_Elm = Gv_TOOLS["e"+(j+1)].elm;
                Lv_elementos.push(Lv_Elm);
              }
              if(Gv_TOOLS["e"+(j+1)].alerta){
                var Lv_Alert = Gv_TOOLS["e"+(j+1)].alerta;
                //Lv_alertas.push(Lv_Alert);
                Lv_alertas[j] = Lv_Alert;
              }
            }
          }
          if(Lv_elementos.length>0 && Lv_alertas.length>0){//verifica elementos requeridos para guarda
            if(!f_ValidaElmRequeridos(Lv_elementos,Lv_alertas)){
              Lv_alertado=true;
            }
          }
          if(!Lv_alertado){
            var Lv_CantDetalle = ($('#id_table1 tbody tr.table-warning').not('.table-danger').length)+($('#id_table1 tbody tr.table-danger').length);
            if(Lv_CantDetalle>0){
              if(!f_ValidaDatosEnTabla()){
                Lv_alertado=true;
              }
            }
          }
          if(!Lv_alertado){
            f_Guardar();
          }else{
            //si faltan elementos requeridos se limpia el secuencial 
            $(P_Elemento_SEC).val('');
            if(LaddaLoad.isLoading()){
              LaddaLoad.stop();  
            }
          }*/
          //verifica elementos requeridos para guarda
          if(f_Validador(Lv_elementos,Lv_alertas)){
            f_Guardar();
          }else{
            //si faltan elementos requeridos se limpia el secuencial 
            $(P_Elemento_SEC).val('');
            if(LaddaLoad.isLoading()){
              LaddaLoad.stop();  
            }
          }
        }
      }else{
        if(LaddaLoad.isLoading()){
          LaddaLoad.stop();  
        }
        alert('Error Buscando Secuencia');
      }
    });
  });
  json.fail(function(r) {
    if(LaddaLoad.isLoading()){
      LaddaLoad.stop();  
    }
  });
}

function f_SetSelectOption(P_consulta,P_Index,P_ultimo){
  var Lv_ArrOptions = [];
  var Lv_Options = '';
  var Lv_data = {funcion:P_consulta};
  var json = $.ajax({
    type: 'post',
    url: 'consultas.php',
    data: Lv_data
  });
  json.done(function(r) {
    $.each(r.datos, function(j,item){
      if(item.c3){
        var Lv_Arr = (Lv_ArrOptions[item.c3]?Lv_ArrOptions[item.c3]:'');
        Lv_ArrOptions[item.c3] = Lv_Arr+"<option value='"+item.c1+"'>"+item.c2+"</option>";
      }  
      Lv_Options += "<option value='"+item.c1+"'>"+item.c2+"</option>"; 
    });
    Gv_LOV_SELECTS[P_Index] = Lv_Options;
    if(Lv_ArrOptions.length>0){
      Gv_LOV_SELECTS2[P_Index] = Lv_ArrOptions;
    }
    if(P_ultimo){
      for(var j=0; j<Object.keys(Gv_TOOLS).length; j+=1){
        if(Gv_TOOLS["e"+(j+1)]){
          var Lv_Elm = Gv_TOOLS["e"+(j+1)];
          if(Lv_Elm.lov_index){
            var Lv_Options = Gv_LOV_SELECTS[Lv_Elm.lov_index];
            if(Lv_Options){
              $(Lv_Elm.elm).html(Lv_Options);
            }
          }
        }
      }
      if($(".select2-basico").length){
        $('.select2-basico').select2({
          width:'100%'
        });
      }
      setTimeout(function (){
        if(Gv_TOOLS.aliniciar){
          $("#id_buscar").click();
        }
      }, 100);
    }
  });
}

function f_LoadSelects(){
  if(Gv_TOOLS.lovs){
    if(Gv_TOOLS.lovs.length>0){
      for(var j=0; j<Gv_TOOLS.lovs.length; j+=1){
        if(Gv_TOOLS.lovs[j]){
          var Lv_ultimo = (j+1==Gv_TOOLS.lovs.length?true:false);
          f_SetSelectOption(Gv_TOOLS.lovs[j],j,Lv_ultimo);
        }
      } 
    }
  }else{
    setTimeout(function (){
      if(Gv_TOOLS.aliniciar){
        $("#id_buscar").click();
      }
    }, 100);
  }
}

function f_Today(){
  var now = new Date();
  var day = ("0" + now.getDate()).slice(-2);
  var month = ("0" + (now.getMonth() + 1)).slice(-2);
  var Gv_Today = now.getFullYear()+"-"+(month)+"-"+(day) ;
  return Gv_Today;
}

function f_DisabledOnQuery(){
  if(Gv_TOOLS.edc.length>0){
    for(var j=0; j<Gv_TOOLS.edc.length; j+=1){
      if(Gv_TOOLS.edc[j]){
        if(Gv_ESTATUS=='C'){
          $(Gv_TOOLS.edc[j]).prop('disabled', true);
          $(Gv_TOOLS.edc[j]).css("opacity","1");
        }
      }
    } 
  }
}

function f_Validador(Lv_elementos,Lv_alertas){
 var Lv_alertado = false;
 var Lv_Valido = false;
  //verifica elementos encabezado
  if(Lv_elementos.length>0 && Lv_alertas.length>0){
    if(!f_ValidaElmRequeridos(Lv_elementos,Lv_alertas)){
      Lv_alertado=true;
    }
  }
  if(!Lv_alertado){
    //verifica elementos detalle
    var Lv_CantDetalle = ($('#id_table1 tbody tr.table-warning').not('.table-danger').length)+($('#id_table1 tbody tr.table-danger').length);
    if(Lv_CantDetalle>0){
      if(!f_ValidaDatosEnTabla()){
        Lv_alertado=true;
      }
    }
  }
  if(!Lv_alertado){
    Lv_Valido = true;
  }
  return Lv_Valido;
}