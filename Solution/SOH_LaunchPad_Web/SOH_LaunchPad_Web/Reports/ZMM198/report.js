'use strict';

Start();

function Start() 
{
    const MaxWaitQueue = 180000;
    const RetryInterval = 1000;

    const urlParams = new URLSearchParams(window.location.search);
    var ReportName = urlParams.get('rn');
    var Report2ndName = "";
    var ReportStep = 1;
    var ReportDisplayName = decodeURIComponent(urlParams.get('fname'));
    var FuncID = urlParams.get('fid');
    var AccessToken = localStorage.getItem('SOH_Token');
    var UserName = localStorage.getItem('SOH_Username');

    var QueueWaitReturn = 0;

    var alvgridDataSource_detail = null;
    var alvgrid_detail = null;

    var alvgridDataSource_item = null;
    var alvgrid_item = null;

    var lastQueueID = null;
    var lastDisplayQueueID = null;
    var reportconfigready = false;

    var dvResultALV = null;
    var dvResultFile = null;

    var selectAddtoQueue = 0;
    var rptAction = "";

    var masterDataSource = new Map();

    var listLayout = null;
    var listLayoutDS = null;

    $(document).ready(Begin);

    function Begin()
    {
        if(ReportName.includes(',')) {
            var chunk = ReportName.split(',');
            ReportName = chunk[0];
            Report2ndName = chunk[1];
        }

        GetReportConfig(ReportName);
        InitOthers();
        CheckInitReady();
    }

    function CheckInitReady()
    {
        if(reportconfigready==true) {
            ShowLoading(false);
        }
        else {
            setTimeout(CheckInitReady, 500);
        }
    }

    function Reporthas2Part() {
        return Report2ndName.length > 1;
    }

    function ShowLoading(show) {
        if(show)
            kendo.fx($("#dvLoadingOverlay")).fade("in").play();
        else
            kendo.fx($("#dvLoadingOverlay")).fade("out").play();
    }


    function InitOthers()
    {
        dvResultALV = $('#dvResultPanel_ALV');
        dvResultFile = $('#dvResultPanel_File');

        $('#lbRptName').empty();
        $('#lbRptName').append("<h3>"+ReportDisplayName+"</h3>");


        $('#btnBack').on( 'click', function() {   
            
            if(Reporthas2Part() && ReportStep == 2) {
                ReportStep = 1;
                reportconfigready = false;
                ShowLoading(true);
                GetReportConfig(ReportName);
                CheckInitReady();
            }
            else {
                ShowResult(false);
                InitKendoValidator();
            }
        });

        $('#btnSubmit').on( 'click', function() {           
            selectAddtoQueue = 0;
            rptAction = "display";
            $("#btnSubmitHidden").click();
            UpdateFuncAccess(FuncID);
        });

        $('#btnExport').on( 'click', function() {           
            selectAddtoQueue = 0;
            rptAction = "export";
            $("#btnSubmitHidden").click();
            UpdateFuncAccess(FuncID);
        });
        

        ShowResult(false);

        $('.FavorStarBtn').click(function(){
            if($(this).children(":last").hasClass('k-i-star-outline')){
                $(this).children(":last").removeClass('k-i-star-outline');
                $(this).children(":last").addClass('k-i-star');
            }
            else {
                $(this).children(":last").removeClass('k-i-star');
                $(this).children(":last").addClass('k-i-star-outline');
            }

            ToggleFavorStar(FuncID);
        });

        GetFavorList(function(ret) {
            if(ret.FavorList.includes(FuncID))
            {
                $('.FavorStarBtn').children(":last").removeClass('k-i-star-outline');
                $('.FavorStarBtn').children(":last").addClass('k-i-star');
            }
        });
    }

    function InitReportConfig(data)
    {
        var radiogroupinclude = [];
        var dvContent = $('#dvNewCallContent');
        var htmlContent = '<form id="inputForm">';
        var invalidateContent = '';

        htmlContent += "<ul>";
        for(var i = 0; i<data.Configs.length; i++) {
            var item = data.Configs[i];
            invalidateContent = '';

            if(item.ControlType == "Radio" && radiogroupinclude.includes(item.RadioGroup)) {
                continue;
            }

            htmlContent += "<li>";

            if(Reporthas2Part() && ReportStep == 2 && item.MstSource.startsWith(ReportName)) {
                var sourcebind = item.MstSource.replace(ReportName + ".", "");
                htmlContent += '<div class="sspcontrol" type="Text" style="display:none">';
                htmlContent += '    <input id="'+item.SelName+'" name="'+item.SelName+'" value="'+item.DefaultValue+'" type="BindResult" bind="'+sourcebind+'">';
                htmlContent += '</div>'; 
            }
            else if(item.ControlType == "CheckBox") {
                htmlContent += '<div class="sspcontrol" type="CheckBox">';
                htmlContent += '  <div>';
                htmlContent += '    <input type="checkbox" class="k-checkbox" id="'+item.SelName+'" '+(item.DefaultValue=="X"?'checked':'')+'>';
                htmlContent += '    <label class="k-checkbox-label" for="'+item.SelName+'">'+item.SelDesc+'</label>';
                htmlContent += '  </div>';
                htmlContent += '</div>';
            }
            else if(item.ControlType == "Range" && item.DataType == "C") {
                htmlContent += '<div class="sspcontrol" type="Range" style="display:flex; align-items:center; flex-wrap: wrap" '+(item.IsRestrict=="1"?'CheckRestrict':'')+'>';
                htmlContent += '  <div class="sspcontrol-Range"><label for="'+item.SelName+'-low" class="sspcontrol-desc">'+item.SelDesc+''+(item.IsMandatory==1?'<label class="sspcontrol-req">*</label>':'')+'</label></div>';
                htmlContent += '  <div class="sspcontrol-Range"><input id="'+item.SelName+'-low" name="'+item.SelName+'-From" class="k-textbox" '+(item.IsMandatory==1?' required ':'')+'></div>';
                htmlContent += '  <div class="sspcontrol-Range"><label for="'+item.SelName+'-high">to </label></div>';
                htmlContent += '  <div class="sspcontrol-Range"><input id="'+item.SelName+'-high" name="'+item.SelName+'-To" class="k-textbox" maxlength="'+item.Length+'" data-comparevalid-field1="'+item.SelName+'-compare" data-comparevalid-field2="'+item.SelName+'-From"></div>';
                htmlContent += '  <div class="sspcontrol-Range">';
                htmlContent += '    <select name="'+item.SelName+'-compare">';
                htmlContent += '      <option value="BT">Between</option>';
                htmlContent += '      <option value="EQ">Equal</option>';
                htmlContent += '      <option value="GE">Greater or Equal</option>';
                htmlContent += '      <option value="LE">Less or Equal</option>';
                htmlContent += '      <option value="GT">Greater</option>';
                htmlContent += '      <option value="LT">Less</option>';
                htmlContent += '      <option value="NE">Not Equal</option>';
                htmlContent += '      <option value="NB">Not Between</option>';
                htmlContent += '   </select>';
                htmlContent += '  </div>';
                htmlContent += '</div>';

                invalidateContent += '<div><span data-for="'+item.SelName+'-From" class="k-invalid-msg"></span></div>';
                invalidateContent += '<div><span data-for="'+item.SelName+'-To" class="k-invalid-msg"</span></div>';
            }
            else if(item.ControlType == "Range" && item.DataType == "D") {
                htmlContent += '<div class="sspcontrol" type="RangeDate" style="display:flex; align-items:center; flex-wrap: wrap;" date-format="yyyyMMdd">';
                htmlContent += '  <div class="sspcontrol-Range"><label for="'+item.SelName+'-low" class="sspcontrol-desc">'+item.SelDesc+''+(item.IsMandatory==1?'<label class="sspcontrol-req">*</label>':'')+'</label></div>';
                htmlContent += '  <div class="sspcontrol-Range"><input id="'+item.SelName+'-low" name="'+item.SelName+'-From" date-format="yyyy-MM-dd" type="date" '+(item.IsMandatory==1?' required ':'')+'></div>';
                htmlContent += '  <div class="sspcontrol-Range"><label for="'+item.SelName+'-high" style="margin-left:0.1em">to </label></div>';
                htmlContent += '  <div class="sspcontrol-Range"><input id="'+item.SelName+'-high" name="'+item.SelName+'-To" date-format="yyyy-MM-dd" type="date" data-comparevalid-field1="'+item.SelName+'-compare" data-comparevalid-field2="'+item.SelName+'-From"></div>';
                htmlContent += '  <div class="sspcontrol-Range" style="margin-left:0.1em">';
                htmlContent += '    <select name="'+item.SelName+'-compare">';
                htmlContent += '      <option value="BT">Between</option>';
                htmlContent += '      <option value="EQ">Equal</option>';
                htmlContent += '      <option value="GE">Greater or Equal</option>';
                htmlContent += '      <option value="LE">Less or Equal</option>';
                htmlContent += '      <option value="GT">Greater</option>';
                htmlContent += '      <option value="LT">Less</option>';
                htmlContent += '      <option value="NE">Not Equal</option>';
                htmlContent += '      <option value="NB">Not Between</option>';
                htmlContent += '   </select>';
                htmlContent += '  </div>';
                htmlContent += '</div>';

                invalidateContent += '<div><span data-for="'+item.SelName+'-From" class="k-invalid-msg"></span></div>';
                invalidateContent += '<div><span data-for="'+item.SelName+'-To" class="k-invalid-msg"</span></div>';
            }    
            else if(item.ControlType == "Range" && item.DataType == "T") {
                htmlContent += '<div class="sspcontrol" type="RangeTime" style="display:flex; align-items:center; flex-wrap: wrap;" time-format="HHmmss">';
                htmlContent += '  <div class="sspcontrol-Range"><label for="'+item.SelName+'-low" class="sspcontrol-desc">'+item.SelDesc+''+(item.IsMandatory==1?'<label class="sspcontrol-req">*</label>':'')+'</label></div>';
                htmlContent += '  <div class="sspcontrol-Range"><input id="'+item.SelName+'-low" name="'+item.SelName+'-From" time-format="HH:mm" type="time" '+(item.IsMandatory==1?' required ':'')+'></div>';
                htmlContent += '  <div class="sspcontrol-Range"><label for="'+item.SelName+'-high" style="margin-left:0.1em">to </label></div>';
                htmlContent += '  <div class="sspcontrol-Range"><input id="'+item.SelName+'-high" name="'+item.SelName+'-To" time-format="HH:mm" type="time" data-comparevalid-field1="'+item.SelName+'-compare" data-comparevalid-field2="'+item.SelName+'-From"></div>';
                htmlContent += '  <div class="sspcontrol-Range" style="margin-left:0.1em">';
                htmlContent += '    <select name="'+item.SelName+'-compare">';
                htmlContent += '      <option value="BT">Between</option>';
                htmlContent += '      <option value="EQ">Equal</option>';
                htmlContent += '      <option value="GE">Greater or Equal</option>';
                htmlContent += '      <option value="LE">Less or Equal</option>';
                htmlContent += '      <option value="GT">Greater</option>';
                htmlContent += '      <option value="LT">Less</option>';
                htmlContent += '      <option value="NE">Not Equal</option>';
                htmlContent += '      <option value="NB">Not Between</option>';
                htmlContent += '   </select>';
                htmlContent += '  </div>';
                htmlContent += '</div>';

                invalidateContent += '<div><span data-for="'+item.SelName+'-From" class="k-invalid-msg"></span></div>';
                invalidateContent += '<div><span data-for="'+item.SelName+'-To" class="k-invalid-msg"</span></div>';
            }   
            else if(item.ControlType == "Range" && item.DataType == "N" && item.Length == 8) {
                htmlContent += '<div class="sspcontrol" type="RangeDate" style="display:flex; align-items:center; flex-wrap: wrap;" date-format="yyyy0MM">';
                htmlContent += '  <div class="sspcontrol-Range"><label for="'+item.SelName+'-low" class="sspcontrol-desc">'+item.SelDesc+''+(item.IsMandatory==1?'<label class="sspcontrol-req">*</label>':'')+'</label></div>';
                htmlContent += '  <div class="sspcontrol-Range"><input id="'+item.SelName+'-low" name="'+item.SelName+'-From" date-format="yyyy0MM" type="date2" '+(item.IsMandatory==1?' required ':'')+'></div>';
                htmlContent += '  <div class="sspcontrol-Range"><label for="'+item.SelName+'-high" style="margin-left:0.1em">to </label></div>';
                htmlContent += '  <div class="sspcontrol-Range"><input id="'+item.SelName+'-high" name="'+item.SelName+'-To" date-format="yyyy0MM" type="date2" data-comparevalid-field1="'+item.SelName+'-compare" data-comparevalid-field2="'+item.SelName+'-From"></div>';
                htmlContent += '  <div class="sspcontrol-Range" style="margin-left:0.1em">';
                htmlContent += '    <select name="'+item.SelName+'-compare">';
                htmlContent += '      <option value="BT">Between</option>';
                htmlContent += '      <option value="EQ">Equal</option>';
                htmlContent += '      <option value="GE">Greater or Equal</option>';
                htmlContent += '      <option value="LE">Less or Equal</option>';
                htmlContent += '      <option value="GT">Greater</option>';
                htmlContent += '      <option value="LT">Less</option>';
                htmlContent += '      <option value="NE">Not Equal</option>';
                htmlContent += '      <option value="NB">Not Between</option>';
                htmlContent += '   </select>';
                htmlContent += '  </div>';
                htmlContent += '</div>';

                invalidateContent += '<div><span data-for="'+item.SelName+'-From" class="k-invalid-msg"></span></div>';
                invalidateContent += '<div><span data-for="'+item.SelName+'-To" class="k-invalid-msg"</span></div>';
            }           
            else if(item.ControlType == "Range" && item.DataType == "P") {
                htmlContent += '<div class="sspcontrol" type="RangeNum" style="display:flex; align-items:center; flex-wrap: wrap">';
                htmlContent += '  <div class="sspcontrol-Range"><label for="'+item.SelName+'-low" class="sspcontrol-desc">'+item.SelDesc+''+(item.IsMandatory==1?'<label class="sspcontrol-req">*</label>':'')+'</label></div>';
                htmlContent += '  <div class="sspcontrol-Range"><input id="'+item.SelName+'-low" name="'+item.SelName+'-From" type="numeric" data-format="c" data-length="'+item.Length+'" data-decimal="'+item.Decimal+'" '+(item.IsMandatory==1?' required ':'')+'></div>';
                htmlContent += '  <div class="sspcontrol-Range"><label for="'+item.SelName+'-high" style="margin-left:2em">to </label></div>';
                htmlContent += '  <div class="sspcontrol-Range"><input id="'+item.SelName+'-high" name="'+item.SelName+'-To" type="numeric" data-format="c" data-length="'+item.Length+'" data-decimal="'+item.Decimal+'" data-comparevalid-field1="'+item.SelName+'-compare" data-comparevalid-field2="'+item.SelName+'-From"></div>';
                htmlContent += '  <div class="sspcontrol-Range" style="margin-left:2em">';
                htmlContent += '    <select name="'+item.SelName+'-compare">';
                htmlContent += '      <option value="BT">Between</option>';
                htmlContent += '      <option value="EQ">Equal</option>';
                htmlContent += '      <option value="GE">Greater or Equal</option>';
                htmlContent += '      <option value="LE">Less or Equal</option>';
                htmlContent += '      <option value="GT">Greater</option>';
                htmlContent += '      <option value="LT">Less</option>';
                htmlContent += '      <option value="NE">Not Equal</option>';
                htmlContent += '      <option value="NB">Not Between</option>';
                htmlContent += '   </select>';
                htmlContent += '  </div>';
                htmlContent += '</div>';

                invalidateContent += '<div><span data-for="'+item.SelName+'-From" class="k-invalid-msg"></span></div>';
                invalidateContent += '<div><span data-for="'+item.SelName+'-To" class="k-invalid-msg"</span></div>';
            }                          
            else if(item.ControlType == "TextBox") {

                if(item.SelDesc.includes("No Display")) {
                    htmlContent += '<div class="sspcontrol" type="Text" style="display:none">';
                    htmlContent += '    <input id="'+item.SelName+'" name="'+item.SelName+'" value="'+item.DefaultValue+'">';
                    htmlContent += '</div>'; 
                }
                else {
                    htmlContent += '<div class="sspcontrol" type="Text" style="display:flex; align-items:center; flex-wrap: wrap" '+(item.IsRestrict=="1"?'CheckRestrict':'')+'>';
                    htmlContent += '  <div class="sspcontrol-Text"><label for="'+item.SelName+'" class="sspcontrol-desc">'+item.SelDesc+''+(item.IsMandatory==1?'<label class="sspcontrol-req">*</label>':'')+'</label></div>';
                    htmlContent += '  <div class="sspcontrol-Text"><input id="'+item.SelName+'" name="'+item.SelName+'" class="k-textbox" style="width:'+Math.min(item.Length+3, document.body.clientWidth * 0.7 / parseFloat($("body").css("font-size")))+'ch" value="'+item.DefaultValue+'" maxlength="'+item.Length+'"' +(item.IsMandatory==1?' required ':'')+'></div>';
                    htmlContent += '</div>'; 

                    //invalidateContent += '<div><span data-for="'+item.SelName+'" class="k-invalid-msg"></span></div>';
                }
            }   
            else if(item.ControlType == "ComboBox" && item.DataType == "C") {
                htmlContent += '<div class="sspcontrol" type="ComboBox" style="display:flex; align-items:center; flex-wrap: wrap" '+(item.IsRestrict=="1"?'CheckRestrict':'')+'>';
                htmlContent += '  <div class="sspcontrol-Range"><label for="'+item.SelName+'-low" class="sspcontrol-desc">'+item.SelDesc+''+(item.IsMandatory==1?'<label class="sspcontrol-req">*</label>':'')+'</label></div>';
                htmlContent += '  <div class="sspcontrol-Range"><input id="'+item.SelName+'-low" name="'+item.SelName+'-From" type="comboS" mstsrc="'+item.MstSource+'" maxlength="'+item.Length+'" '+(item.IsMandatory==1?' required ':'')+'></div>';
                htmlContent += '</div>';

                //invalidateContent += '<div><span data-for="'+item.SelName+'-from" class="k-invalid-msg"></span></div>';
            }                              
            else if(item.ControlType == "ComboBoxRange" && item.DataType == "C") {
                htmlContent += '<div class="sspcontrol" type="RangeCbx" style="display:flex; align-items:center; flex-wrap: wrap" '+(item.IsRestrict=="1"?'CheckRestrict':'')+'>';
                htmlContent += '  <div class="sspcontrol-Range"><label for="'+item.SelName+'-low" class="sspcontrol-desc">'+item.SelDesc+''+(item.IsMandatory==1?'<label class="sspcontrol-req">*</label>':'')+'</label></div>';
                htmlContent += '  <div class="sspcontrol-Range"><input id="'+item.SelName+'-low" name="'+item.SelName+'-From" type="comboS" mstsrc="'+item.MstSource+'" maxlength="'+item.Length+'" '+(item.IsMandatory==1?' required ':'')+'></div>';
                htmlContent += '  <div class="sspcontrol-Range"><label for="'+item.SelName+'-high" style="margin-left:2em">to </label></div>';
                htmlContent += '  <div class="sspcontrol-Range"><input id="'+item.SelName+'-high" name="'+item.SelName+'-To" type="comboS" mstsrc="'+item.MstSource+'" maxlength="'+item.Length+'" data-comparevalid-field1="'+item.SelName+'-compare" data-comparevalid-field2="'+item.SelName+'-From"></div>';
                htmlContent += '  <div class="sspcontrol-Range" style="margin-left:2em">';
                htmlContent += '    <select name="'+item.SelName+'-compare">';
                htmlContent += '      <option value="BT">Between</option>';
                htmlContent += '      <option value="EQ">Equal</option>';
                htmlContent += '      <option value="GE">Greater or Equal</option>';
                htmlContent += '      <option value="LE">Less or Equal</option>';
                htmlContent += '      <option value="GT">Greater</option>';
                htmlContent += '      <option value="LT">Less</option>';
                htmlContent += '      <option value="NE">Not Equal</option>';
                htmlContent += '      <option value="NB">Not Between</option>';
                htmlContent += '   </select>';
                htmlContent += '  </div>';
                htmlContent += '</div>';

                invalidateContent += '<div><span data-for="'+item.SelName+'-From" class="k-invalid-msg"></span></div>';
                invalidateContent += '<div><span data-for="'+item.SelName+'-To" class="k-invalid-msg"</span></div>';
            }        
            else if(item.ControlType == "MultiSelectRange" && item.DataType == "C") {
                htmlContent += '<div class="sspcontrol" type="RangeMS" style="display:flex; align-items:center; flex-wrap: wrap" '+(item.IsRestrict=="1"?'CheckRestrict':'')+'>';
                htmlContent += '  <div class="sspcontrol-Range"><label for="'+item.SelName+'-low" class="sspcontrol-desc">'+item.SelDesc+''+(item.IsMandatory==1?'<label class="sspcontrol-req">*</label>':'')+'</label></div>';
                htmlContent += '  <div class="sspcontrol-Range"><input id="'+item.SelName+'-low" name="'+item.SelName+'-From" type="comboM" mstsrc="'+item.MstSource+'" dependant="'+item.Dependant+'" maxlength="'+item.Length+'" '+(item.IsMandatory==1?' msrequired ':'')+'></div>';
                htmlContent += '  <div class="sspcontrol-Range"><label for="'+item.SelName+'-high" style="margin-left:0em">to </label></div>';
                htmlContent += '  <div class="sspcontrol-Range"><input id="'+item.SelName+'-high" name="'+item.SelName+'-To" type="comboM" mstsrc="'+item.MstSource+'" dependant="'+item.Dependant+'" maxlength="'+item.Length+'" data-comparevalid-field1="'+item.SelName+'-compare" data-comparevalid-field2="'+item.SelName+'-From"></div>';
                htmlContent += '  <div class="sspcontrol-Range" style="margin-left:0em">';
                htmlContent += '    <select name="'+item.SelName+'-compare">';
                htmlContent += '      <option value="BT">Between</option>';
                htmlContent += '      <option value="EQ">Equal</option>';
                htmlContent += '      <option value="GE">Greater or Equal</option>';
                htmlContent += '      <option value="LE">Less or Equal</option>';
                htmlContent += '      <option value="GT">Greater</option>';
                htmlContent += '      <option value="LT">Less</option>';
                htmlContent += '      <option value="NE">Not Equal</option>';
                htmlContent += '      <option value="NB">Not Between</option>';
                htmlContent += '   </select>';
                htmlContent += '  </div>';
                htmlContent += '</div>';

                invalidateContent += '<div><span data-for="'+item.SelName+'-From" class="k-invalid-msg"></span></div>';
                invalidateContent += '<div><span data-for="'+item.SelName+'-To" class="k-invalid-msg"</span></div>';
            } 
            else if(item.ControlType == "" && item.DataType == "D") {
                htmlContent += '<div class="sspcontrol" type="Date" style="display:flex; align-items:center; flex-wrap: wrap" date-format="yyyyMMdd">';
                htmlContent += '  <div class="sspcontrol-Range"><label for="'+item.SelName+'-low" class="sspcontrol-desc">'+item.SelDesc+''+(item.IsMandatory==1?'<label class="sspcontrol-req">*</label>':'')+'</label></div>';
                htmlContent += '  <div class="sspcontrol-Range"><input id="'+item.SelName+'-low" name="'+item.SelName+'-From" date-format="yyyy-MM-dd" type="date3" '+(item.IsMandatory==1?' required ':'')+'></div>';
                htmlContent += '</div>';

                //invalidateContent += '<div><span data-for="'+item.SelName+'-From" class="k-invalid-msg"></span></div>';
            }
            else if(item.ControlType == "" && item.DataType == "T") {
                htmlContent += '<div class="sspcontrol" type="Time" style="display:flex; align-items:center; flex-wrap: wrap" time-format="HHmmss">';
                htmlContent += '  <div class="sspcontrol-Range"><label for="'+item.SelName+'-low" class="sspcontrol-desc">'+item.SelDesc+''+(item.IsMandatory==1?'<label class="sspcontrol-req">*</label>':'')+'</label></div>';
                htmlContent += '  <div class="sspcontrol-Range"><input id="'+item.SelName+'-low" name="'+item.SelName+'-From" time-format="HH:mm" type="time" '+(item.IsMandatory==1?' required ':'')+'></div>';
                htmlContent += '</div>';

                //invalidateContent += '<div><span data-for="'+item.SelName+'-From" class="k-invalid-msg"></span></div>';
            }                    
            else if(item.ControlType == "Radio") {
                var allgroupitems = data.Configs.filter(config=>config.RadioGroup == item.RadioGroup);
                radiogroupinclude.push(item.RadioGroup);

                htmlContent += '<div class="sspcontrol" type="Radio" data-name="ssradio-'+item.RadioGroup+'">';
                htmlContent += '  <ul class="sspcontrol-radiolist">';

                for(var r=0; r<allgroupitems.length; r++) {
                    htmlContent += '<li>';
                    htmlContent += '<input type="radio" id="'+allgroupitems[r].SelName+'" name="ssradio-'+item.RadioGroup+'" value="'+allgroupitems[r].SelName+'" class="k-radio" '+(allgroupitems[r].DefaultValue=='X'?'checked="checked"':'')+'>';
                    htmlContent += '<label class="k-radio-label" for="'+allgroupitems[r].SelName+'">'+allgroupitems[r].SelDesc+'</label>';
                    htmlContent += '</li>';
                }

                htmlContent += '  </ul>';
                htmlContent += '</div>';
            }
            else {
                htmlContent += "<div>Error: Unmanaged Control Type - "+ item.SelName + "[" + item.ControlType+ "]</div>";
            }
            
            htmlContent += invalidateContent;
            htmlContent += "</li>";
        }

        htmlContent += '<li>';
        htmlContent += '    <div><button class="k-button k-primary hidden" id="btnSubmitHidden">S</button></div>';
        htmlContent += '</li>';
        htmlContent += "</ul></form>";
        
        dvContent.html(htmlContent);

        var selectControls = dvContent.find("select");
        selectControls.each(function(){
            $(this).kendoDropDownList();
        });

        var selectRangeDateControls = $('#dvNewCallContent input[type=date]');
        selectRangeDateControls.each(function(){
            $(this).kendoDatePicker({
                start: "day",
                depth: "day",
                format: $(this).attr('date-format'),
                //dateInput: true
            });
        });

        var selectRangeDate2Controls = $('#dvNewCallContent input[type=date2]');
        selectRangeDate2Controls.each(function(){
            $(this).kendoDatePicker({
                start: "month",
                depth: "month",
                format: $(this).attr('date-format'),
            });
        });

        var selectDateControls = $('#dvNewCallContent input[type=date3]');
        selectDateControls.each(function(){
            $(this).kendoDatePicker({
                start: "day",
                depth: "day",
                format: $(this).attr('date-format'),
            });
        });

        var selectTimeControls = $('#dvNewCallContent input[type=time]');
        selectTimeControls.each(function(){
            $(this).kendoTimePicker({
                interval: 15,
                format: $(this).attr('time-format'),
            });
        });

        var selectRangeNumControls = $('#dvNewCallContent input[type=numeric]');
        selectRangeNumControls.each(function(){
            $(this).kendoNumericTextBox({
                format: $(this).attr('data-format') + $(this).attr('data-decimal'),
                min: 0,
                max: Math.pow(10, $(this).attr('data-length')) - 1,
                decimals: $(this).attr('data-decimal')
            });
        });

        var selectRangeComboControls = $('#dvNewCallContent input[type=comboS]');
        selectRangeComboControls.each(function(){
            var mstSource = $(this).attr('mstsrc');
            $(this).kendoComboBox({
                filter:"contains",
                dataTextField: "Code",
                dataValueField: "Code",
                headerTemplate: '',
                template:   '<span style="display: inline-block; min-width: 115px">#=data.Code#</span>' + 
                            '<span style="display: inline-block; min-width: 140px">#=data.Description#</span>',
                dataSource: GetMasterDataSource($(this).attr('mstsrc')),
                filtering: function(ev) {
                    var filterValue = ev.filter != undefined ? ev.filter.value : "";
                    ev.preventDefault();

                    var customerFilter = {
                        logic: "or",
                        filters: [
                        {
                            field: "Code",
                            operator: "contains",
                            value: filterValue
                        },
                        {
                            field: "Description",
                            operator: "contains",
                            value: filterValue
                        }
                        ]
                    };

                    this.dataSource.filter(customerFilter);
                },
                virtual: {
                    itemHeight: 26,
                    valueMapper: function(options) {
                        $.ajax({
                            url: "../../Reports/SapReport.ashx",
                            type: "POST",
                            dataType: "json",
                            data: {
                                Action: "getmasterdataValueMap",
                                Token: AccessToken,
                                FuncID: FuncID,
                                Report: ReportName,
                                MstName: mstSource,
                                DataMap: function() {
                                        var value = options.value;
                                        value = $.isArray(value) ? value : [value];
                                        var data = [];
                                        for (var idx = 0; idx < value.length; idx++) {
                                            data.push(value[idx]);
                                        }
        
                                        return kendo.stringify(data);
                                    },  
                            },
                            success: function (data) {
                                options.success(data);
                            }
                        });
                    }
                },            
                dataBound: function (e) {
                    var listContainer = e.sender.list.closest(".k-list-container");
                    listContainer.width(400 + kendo.support.scrollbar());
                },                    
                autoWidth: true,
                height: 400,
                animation: false
            });
        });        

        var selectRangeMulSelectControls = $('#dvNewCallContent input[type=comboM]');
        selectRangeMulSelectControls.each(function(){
            var mstSource = $(this).attr('mstsrc');
            $(this).kendoMultiSelect({
                filter:"contains",
                dataTextField: "Code",
                dataValueField: "Code",
                headerTemplate: '',
                template:   '<span style="display: inline-block; min-width: 115px">#=data.Code#</span>' + 
                            '<span style="display: inline-block; min-width: 140px">#=data.Description#</span>',
                dataSource: GetMasterDataSource(mstSource),
                change: function(e) {
                    var dependant = $(this.element[0]).attr('dependant');
                    if(dependant.length > 0) {
                        var filterObj = GetMSFilterbyDependant(dependant);
                        $('input[id*='+dependant+']').each(function() {
                            var s = $(this).data("kendoMultiSelect");
                            s.dataSource.filter(filterObj);
                        });
                    }
                },
                filtering: function(ev) {
                    var filterValue = ev.filter != undefined ? ev.filter.value : "";
                    ev.preventDefault();

                    var sid = $(this.element[0]).attr('id').split('-')[0];
                    var filterObj = GetMSFilterbyDependant(sid);
                    
                    var customerFilter = {
                        logic: "or",
                        filters: [
                        {
                            field: "Code",
                            operator: "contains",
                            value: filterValue
                        },
                        {
                            field: "Description",
                            operator: "contains",
                            value: filterValue
                        }
                        ]
                    };

                    if(filterObj.filters.length > 0) {
                        this.dataSource.filter({
                            logic: "and",
                            filters: [filterObj, customerFilter]
                        });
                    }
                    else {
                        this.dataSource.filter(customerFilter);
                    }
                },
                virtual: {
                    itemHeight: 26,
                    valueMapper: function(options) {
                        $.ajax({
                            url: "../../Reports/SapReport.ashx",
                            type: "POST",
                            dataType: "json",
                            data: {
                                Action: "getmasterdataValueMap",
                                Token: AccessToken,
                                FuncID: FuncID,
                                Report: ReportName,
                                MstName: mstSource,
                                DataMap: function() {
                                        var value = options.value;
                                        value = $.isArray(value) ? value : [value];
                                        var data = [];
                                        for (var idx = 0; idx < value.length; idx++) {
                                            data.push(value[idx]);
                                        }
        
                                        return kendo.stringify(data);
                                    },  
                            },
                            success: function (data) {
                                options.success(data);
                            }
                        });
                    }
                },
                dataBound: function (e) {
                    var listContainer = e.sender.list.closest(".k-list-container");
                    listContainer.width(500 + kendo.support.scrollbar());
                },
                autoWidth: true,
                height: 400,
                animation: false
            });
        });
        

        var $checkboxes = $('#dvNewCallContent input[type=checkbox]');
        $checkboxes.change(function(){
            typeof $(this).attr('checked') == "undefined" ? $(this).attr('checked', 'checked') : $(this).removeAttr('checked');
        });


        InitKendoValidator();

        $("#inputForm").submit(function(event) {
            event.preventDefault();
            var validator = $("#inputForm").kendoValidator().data("kendoValidator");
            if (validator.validate()) {
                DisableSubmit(true);
                var reportData = BuildReportSelection();
                if(rptAction == "export") {
                    CreateNewExport(reportData, ReportName);
                }
                else {
                    CreateNewReport(reportData, ReportName);
                }
            } else {
                alert("Oops! There is invalid data in the form.");
            }
        });

        reportconfigready = true;
    }

    function InitKendoValidator()
    {
        $("#inputForm").kendoValidator({
            rules: {
                dateValidation: function (input) {
                    var value = $(input).val();
                    if ($(input).attr("data-role")=="datepicker" && value != "" && $(input).attr("type") == "date") {    
                        var d = new Date(value);
                        return d instanceof Date && !isNaN(d.getTime());
                    }

                    return true;
                },
                multiSelectValid: function (input) {
                    var req = $(input).attr('msrequired');
                    if ($(input).attr("data-role")=="multiselect" && typeof req !== typeof undefined && req !== false) {
                        var ms = input.data("kendoMultiSelect"); 
                        if(ms.value().length === 0) {
                            return false;
                        }
                    }

                    return true;
                },

            },
            messages: {
                required: "This field is required",
                dateValidation: "Invalid date format",
                multiSelectValid: "This field is required, select at least one",
                comparevalid: "[To] value cannot be empty when choose [Between] or [Not Between] "
            }
        });
    }

    function GetMSFilterbyDependant(dependant) 
    {
        var filterObject = {};
        var filterList = [];

        var inputs = $('input[dependant='+dependant+']');
        for(var i=0; i<inputs.length; i++){
            var ms = $(inputs[i]).data("kendoMultiSelect");
            var values = ms.value();
            for(var j=0; j<values.length; j++){
                filterList.push({ field: "RefCode", operator: "eq", value: values[j] });
            }
        }

        filterObject.logic = "or";
        filterObject.filters = filterList;

        return filterObject;
    }

    function DisableSubmit(disable)
    {
        if(disable == true)
        {
            $('#btnSubmit').attr('disabled', 'disabled');
            $('#btnAddQueue').attr('disabled', 'disabled');
            $('#btnAddEmail').attr('disabled', 'disabled');
        }
        else
        {            
            $('#btnSubmit').removeAttr('disabled');
            $('#btnAddQueue').removeAttr('disabled');
            $('#btnAddEmail').removeAttr('disabled');
        }
    }

    function ShowResult(doShow)
    {
        if(doShow) {
            $('#dvNewCallContent').hide();
            $('#btnAddQueue').hide();
            $('#btnSubmit').hide();
            $('#btnAddEmail').hide();
            $('#btnBack').show();
            $('#btnExport').show();
        }
        else {
            $('#dvNewCallContent').show();
            $('#btnAddQueue').show();
            $('#btnAddEmail').show();
            $('#btnSubmit').show();
            $('#btnBack').hide();
            $('#btnExport').hide();
            dvResultALV.hide();
            dvResultFile.hide();

            if(Reporthas2Part()) {
                $('#btnAddQueue').hide();
                $('#btnAddEmail').hide();
            }
        }
    }


    function GetMasterDataSource(mstName)
    {
        //if(masterDataSource.has(mstName))
        //    return masterDataSource.get(mstName);

        var source = new kendo.data.DataSource({
            transport: {
                read: {
                    url: "../../Reports/SapReport.ashx",
                    dataType: "json",
                    type: "POST",
                    contentType: "application/json; charset=utf-8",
                    xhrFields: {
                        withCredentials: true
                    },
                    data: {
                        Action: "getmasterdata",
                        Token: AccessToken,
                        FuncID: FuncID,
                        Report: ReportName,
                        MstName: mstName    
                    },
                    error: function (xhr, error) {
                        console.debug(xhr); console.debug(error);
                    }
                },
                parameterMap: function(data, type) {
                    if(data.filter)
                        data.filter = kendo.stringify(data.filter);

                    return data;
                },
                cache: "inmemory"
            },
            schema: {
                model: {
                    fields: {
                        Code: { type: "string" },
                        Description: { type: "string" },
                        RefCode: { type: "string" }
                    }
                },
                data: "ListData",
                total: "TotalCount"
            },
            pageSize: 100,
            serverPaging: true,
            serverFiltering: true
        });

        //masterDataSource.set(mstName, source);
        return source;
    }

    function InitALVGrid_Detail(config)
    {
        if(alvgrid_detail != null) {
            alvgrid_detail.data("kendoGrid").destroy();
            alvgrid_detail.empty();
        }
        
        alvgridDataSource_detail = new kendo.data.DataSource({
            transport: {
                read: {
                    url: "../../Reports/SapReport.ashx",
                    dataType: "json",
                    type: "POST",
                    contentType: "application/json; charset=utf-8",
                    xhrFields: {
                        withCredentials: true
                    },
                    data: ALVGridDataSourceFilter("ZRMM198_Detail"),
                    complete: ALVGridGetDataReturn,
                    error: function (xhr, error) {
                        console.debug(xhr); console.debug(error);
                    }
                },
                parameterMap: function(data, type) {
                    if(data.filter)
                        data.filter = kendo.stringify(data.filter);
                    if(data.sort)
                        data.sort = kendo.stringify(data.sort);
                    return data;
                },
            },
            schema: {
                model: {
                    id: "Id",
                    fields: JSON.parse(config.SchemaSetting)
                },
                data: "ListData",
                total: "TotalCount"
            },
            pageSize: 100,
            serverPaging: true,
            serverFiltering: true,
            serverSorting: true
        });

        var columnSetting = JSON.parse(config.ColumnSetting);
        if(ReportStep == 2) {
            var selectcol = { selectable: true, width: "44px" };
            columnSetting.unshift(selectcol);
        }

        alvgrid_detail = $("#gridResult_Detail").kendoGrid({
            autoBind: true,
            dataSource: alvgridDataSource_detail,
            height: window.parent.innerHeight - 500,
            theme: "default",
            sortable: true,
            reorderable: true,
            groupable: false,
            resizable: true,
            filterable: true,
            columnMenu: true,
            //selectable: "row",
            scrollable: {
                virtual: true
            },
            change: ALVGridonSelect,
            persistSelection: true,
            pageable: false,
            excel: {
                allPages: true
            },
            // dataBound: function() {
            //     for (var i = 0; i < this.columns.length; i++) {
            //       this.autoFitColumn(i);
            //     }
            // },
            columns: columnSetting
        });     
        
        //ALVGridReload();
    }

    function InitALVGrid_Item(config)
    {
        if(alvgrid_item != null) {
            alvgrid_item.data("kendoGrid").destroy();
            alvgrid_item.empty();
        }
        
        alvgridDataSource_item = new kendo.data.DataSource({
            transport: {
                read: {
                    url: "../../Reports/SapReport.ashx",
                    dataType: "json",
                    type: "POST",
                    contentType: "application/json; charset=utf-8",
                    xhrFields: {
                        withCredentials: true
                    },
                    data: ALVGridDataSourceFilter("ZRMM198_SO_Item"),
                    complete: ALVGridGetDataReturn,
                    error: function (xhr, error) {
                        console.debug(xhr); console.debug(error);
                    }
                },
                parameterMap: function(data, type) {
                    if(data.filter)
                        data.filter = kendo.stringify(data.filter);
                    if(data.sort)
                        data.sort = kendo.stringify(data.sort);
                    return data;
                },
            },
            schema: {
                model: {
                    id: "Id",
                    fields: JSON.parse(config.SchemaSetting)
                },
                data: "ListData",
                total: "TotalCount"
            },
            pageSize: 100,
            serverPaging: true,
            serverFiltering: true,
            serverSorting: true
        });

        var columnSetting = JSON.parse(config.ColumnSetting);
        if(ReportStep == 2) {
            var selectcol = { selectable: true, width: "44px" };
            columnSetting.unshift(selectcol);
        }

        alvgrid_item = $("#gridResult_Item").kendoGrid({
            autoBind: true,
            dataSource: alvgridDataSource_item,
            height: window.parent.innerHeight - 500,
            theme: "default",
            sortable: true,
            reorderable: true,
            groupable: false,
            resizable: true,
            filterable: true,
            columnMenu: true,
            //selectable: "row",
            scrollable: {
                virtual: true
            },
            change: ALVGridonSelect,
            persistSelection: true,
            pageable: false,
            excel: {
                allPages: true
            },
            // dataBound: function() {
            //     for (var i = 0; i < this.columns.length; i++) {
            //       this.autoFitColumn(i);
            //     }
            // },
            columns: columnSetting
        });     
        
        //ALVGridReload();
    }

    function ALVGridonSelect(e) 
    {
        // var dataItemSet = [];
        // var rows = e.sender.select();
        // rows.each(function() {
        //     var dataItem = alvgrid.data("kendoGrid").dataItem(this);
        //     dataItemSet.push(dataItem);
        //     //console.log(dataItem);
        // });

        // ALVGridSetResultSelectBind(dataItemSet);
    }

    function ALVGridSetResultSelectBind(dataItemSet)
    {
        // var selectBindControls = $('#dvNewCallContent input[type=BindResult]');
        // selectBindControls.each(function(){
        //     var key = $(this).attr('bind');
        //     var value = [];
        //     for(var i=0; i<dataItemSet.length; i++) {
        //         var dataItem = dataItemSet[i];
        //         if (key in dataItem) {
        //             value.push(dataItem[key]);
        //         }
        //     }
        //     $(this).val(value.join(','));
        // });
    }

    function ALVGridReload() 
    {
        alvgridDataSource.read();
    }

    function ALVGridDataSourceFilter(rptName)
    {
        var results = {};

        results.Action = "getalvdata";
        results.Token = AccessToken;
        results.FuncID = FuncID;
        results.Report = rptName;
        results.QID = lastQueueID;

        return results;
    }

    function ALVGridGetDataReturn(_jqXHR, _textStatus) 
    {
    }

    function InitResultDvHeader(result_data) {
        let dvContent = $('#dvResultHeader');
        let htmlContent = "";
        let hdr = result_data.ListData[0];

        let mapping = [];
        
        mapping = [
            { type: "label", field: "VBELN", title: "Sales Order"}, 
            { type: "label", field: "FACTY", title: "Factory"}, 
            { type: "label", field: "PPNAME", title: "Pur"},  
            { type: "label", field: "BNAME", title: "Company Code"}, 
            { type: "label", field: "TTQTY", title: "Total Qty" }, 
            { type: "label", field: "TDate", title: "Date"}, 
            { type: "label", field: "CUSTN", title: "Customer"}, 
            { type: "spaceholder"},
        ];

        mapping.forEach(function(item) {
            
            if(item.type == "label") {
                htmlContent += '<div style="display: flex">';
                htmlContent += '<div class="FixLabel"><label>'+item.title+'</label></div>';
                htmlContent += '<div style="margin-right: 4.4em; margin-top: 0.5em">';
                htmlContent += '    <input type="text" class="k-textbox" value="'+toFormat(hdr[item.field], item.format)+'" readonly>';
                htmlContent += '</div></div>';
            }
            else if(item.type == "spaceholder") {
                htmlContent += '<div class="dvSpaceHolder"></div>';
            }
            else if(item.type == "label-2") {
                htmlContent += '<div style="display: flex">';
                htmlContent += '<div class="FixLabel"><label>'+item.title+'</label></div>';
                htmlContent += '<div style="margin-right: 1.2em; margin-top: 0.5em">';
                htmlContent += '    <input type="text" class="k-textbox" value="'+toFormat(hdr[item.field], item.format)+'" readonly>';
                htmlContent += '    <input type="text" class="k-textbox" value="'+hdr[item.field2]+'" style="width: 2.4em;" readonly>';
                htmlContent += '</div></div>'; 
            }
        });

        dvContent.html(htmlContent);
    }

    
    function toFormat(value, format) {
        if(format == "money")
            return value.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
        else if(format == "integer")
            return parseInt(value);
        else
            return value;
    }

    function BuildReportSelection()
    {
        var controls = $('#dvNewCallContent').find('.sspcontrol');

        var reportData = {};
        reportData.ReportName = ReportStep == 1? ReportName : Report2ndName;
        reportData.Selection = [];
        
        controls.each(function(){
            var type = $(this).attr('type');
            var checkRestrict = $(this).attr('CheckRestrict');
            if(type == 'Range') {
                let sel = {};
                sel.SelName = $($(this).find('input')[0]).attr('id').split('-')[0];
                sel.Kind = 'S';
                sel.Sign = 'I';
                sel.SelOption = $($(this).find('select')[0]).val();
                sel.Low = $($(this).find('input')[0]).val();
                sel.High = $($(this).find('input')[1]).val();

                if(sel.Low.includes(",")) {
                    var selarr = sel.Low.split(',');
                    for(var i=0; i<selarr.length; i++){
                        var item = {};
                        item.SelName = sel.SelName;
                        item.Kind = sel.Kind;
                        item.Sign = sel.Sign;
                        
                        item.Low = selarr[i];
                        item.High = "";
    
                        if(item.Low.includes("*"))
                            item.SelOption = "CP";
                        else
                            item.SelOption = "EQ";
                            
                        reportData.Selection.push(item);
                    }
                }
                else {
                    if(sel.Low.includes("*") || sel.High.includes("*"))
                        sel.SelOption = "CP";
                    else if(sel.High.length <= 0 && (sel.SelOption == "BT" || sel.SelOption == "NT"))
                        sel.SelOption = "EQ";

                    if(sel.Low.length > 0 || sel.High.length > 0)
                        reportData.Selection.push(sel);
                    else {
                        if (typeof checkRestrict !== typeof undefined && checkRestrict !== false) {
                            sel.SelOption = "";
                            sel.Low = "";
                            sel.High = "";
                            reportData.Selection.push(sel);
                        }
                    }
                }
            }
            else if(type == 'RangeNum') {
                let sel = {};
                sel.SelName = $($(this).find('input')[1]).attr('id').split('-')[0];
                sel.Kind = 'S';
                sel.Sign = 'I';
                sel.SelOption = $($(this).find('select')[0]).val();
                sel.Low = $($(this).find('input')[1]).val();
                sel.High = $($(this).find('input')[3]).val();

                if(sel.High.length <= 0 && (sel.SelOption == "BT" || sel.SelOption == "NT"))
                    sel.SelOption = "EQ";

                if(sel.Low.length > 0 || sel.High.length > 0)
                    reportData.Selection.push(sel);
            }
            else if(type == 'RangeDate') {
                let sel = {};
                sel.SelName = $($(this).find('input')[0]).attr('id').split('-')[0];
                sel.Kind = 'S';
                sel.Sign = 'I';
                sel.SelOption = $($(this).find('select')[0]).val();

                let dateformat = $(this).attr('date-format');
                let datefrom = $($(this).find('input')[0]).data("kendoDatePicker").value();
                let dateto = $($(this).find('input')[1]).data("kendoDatePicker").value();
                sel.Low = kendo.toString(datefrom, dateformat);
                sel.High = kendo.toString(dateto, dateformat);

                if(sel.High == null && (sel.SelOption == "BT" || sel.SelOption == "NT"))
                    sel.SelOption = "EQ";

                if(sel.Low != null || sel.High != null)
                    reportData.Selection.push(sel);
            }  
            else if(type == 'RangeTime') {
                let sel = {};
                sel.SelName = $($(this).find('input')[0]).attr('id').split('-')[0];
                sel.Kind = 'S';
                sel.Sign = 'I';
                sel.SelOption = $($(this).find('select')[0]).val();

                let dateformat = $(this).attr('time-format');
                let datefrom = $($(this).find('input')[0]).data("kendoTimePicker").value();
                let dateto = $($(this).find('input')[1]).data("kendoTimePicker").value();
                sel.Low = kendo.toString(datefrom, dateformat);
                sel.High = kendo.toString(dateto, dateformat);

                if(sel.High == null && (sel.SelOption == "BT" || sel.SelOption == "NT"))
                    sel.SelOption = "EQ";

                if(sel.Low != null || sel.High != null)
                    reportData.Selection.push(sel);
            }           
            else if(type == 'RangeCbx') {
                let sel = {};
                sel.SelName = $($(this).find('input')[1]).attr('id').split('-')[0];
                sel.Kind = 'S';
                sel.Sign = 'I';
                sel.SelOption = $($(this).find('select')[0]).val();

                let from = $($(this).find('input')[1]).data("kendoComboBox").value();
                let to = $($(this).find('input')[3]).data("kendoComboBox").value();
                sel.Low = from;
                sel.High = to;

                if(sel.Low != null || sel.High != null) {
                    if(sel.Low.includes("*") || sel.High.includes("*"))
                        sel.SelOption = "CP";
                    else if(sel.High == null && (sel.SelOption == "BT" || sel.SelOption == "NT"))
                        sel.SelOption = "EQ";

                    reportData.Selection.push(sel);
                }
                else {
                    if (typeof checkRestrict !== typeof undefined && checkRestrict !== false) {
                        sel.SelOption = "";
                        sel.Low = "";
                        sel.High = "";
                        reportData.Selection.push(sel);
                    }
                }
                
            }
            else if(type == 'RangeMS') {
                let sel = {};
                sel.SelName = $($(this).find('input')[1]).attr('id').split('-')[0];
                sel.Kind = 'S';
                sel.Sign = 'I';
                sel.SelOption = $($(this).find('select')[0]).val();

                let fromVals = $($(this).find('input')[1]).data("kendoMultiSelect").value();
                let toVals = $($(this).find('input')[3]).data("kendoMultiSelect").value();
                                
                for(let i=0; i<fromVals.length; i++) {
                    let item = {};
                    item.SelName = sel.SelName;
                    item.Kind = sel.Kind;
                    item.Sign = sel.Sign;
                    
                    item.Low = fromVals[i];

                    if(toVals.length > i){
                        item.High = toVals[i];
                        item.SelOption = sel.SelOption;
                    }
                    else if (sel.SelOption == "BT" || sel.SelOption == "NT") {
                        item.SelOption = "EQ";
                    }
                    else {
                        item.SelOption = sel.SelOption;
                    }

                    if(item.Low.includes("*"))
                        item.SelOption = "CP";

                    reportData.Selection.push(item);
                }

                if(fromVals.length == 0) {
                    if (typeof checkRestrict !== typeof undefined && checkRestrict !== false) {
                        sel.SelOption = "";
                        sel.Low = "";
                        sel.High = "";
                        reportData.Selection.push(sel);
                    }
                }
            }
            else if(type == 'ComboBox') {
                let sel = {};
                sel.SelName = $($(this).find('input')[1]).attr('id').split('-')[0];
                sel.Kind = 'S';
                sel.Sign = 'I';
                sel.SelOption = 'EQ';

                let from = $($(this).find('input')[1]).data("kendoComboBox").value();
                sel.Low = from;

                if(sel.Low != null) {
                    if(sel.Low.includes("*"))
                        sel.SelOption = "CP";

                    reportData.Selection.push(sel);
                }
                else {
                    if (typeof checkRestrict !== typeof undefined && checkRestrict !== false) {
                        sel.SelOption = "";
                        sel.Low = "";
                        sel.High = "";
                        reportData.Selection.push(sel);
                    }
                }
            } 
            else if(type == 'Date') {
                let sel = {};
                sel.SelName = $($(this).find('input')[0]).attr('id').split('-')[0];
                sel.Kind = 'P';
                sel.Sign = 'I';
                sel.SelOption = "EQ";

                let dateformat = $(this).attr('date-format');
                let datefrom = $($(this).find('input')[0]).data("kendoDatePicker").value();
                sel.Low = kendo.toString(datefrom, dateformat);
                sel.High = '';

                if(sel.Low != null || sel.High != null)
                    reportData.Selection.push(sel);
            } 
            else if(type == 'Time') {
                let sel = {};
                sel.SelName = $($(this).find('input')[0]).attr('id').split('-')[0];
                sel.Kind = 'P';
                sel.Sign = 'I';
                sel.SelOption = "EQ";

                let dateformat = $(this).attr('time-format');
                let datefrom = $($(this).find('input')[0]).data("kendoTimePicker").value();
                sel.Low = kendo.toString(datefrom, dateformat);
                sel.High = '';

                if(sel.Low != null || sel.High != null)
                    reportData.Selection.push(sel);
            }              
            else if( type == 'Text' ) {
                let sel = {};
                sel.SelName = $($(this).find('input')).attr('id');
                sel.Kind = 'P';
                sel.Sign = 'I';
                sel.SelOption = 'EQ';
                sel.Low = $($(this).find('input')).val();
                sel.High = '';

                if(sel.Low.length > 0) {
                    if(sel.Low.includes(",")) {
                        let selarr = sel.Low.split(',');
                        for(let i=0; i<selarr.length; i++) {
                            let item = {};
                            item.SelName = sel.SelName;
                            item.Kind = sel.Kind;
                            item.Sign = sel.Sign;
                            
                            item.Low = selarr[i];
                            item.High = "";
        
                            if(item.Low.includes("*"))
                                item.SelOption = "CP";
                            else
                                item.SelOption = "EQ";
                                
                            reportData.Selection.push(item);
                        }
                    }
                    else
                        reportData.Selection.push(sel);
                }
                else {
                    if (typeof checkRestrict !== typeof undefined && checkRestrict !== false) {
                        sel.SelOption = "";
                        sel.Low = "";
                        sel.High = "";
                        reportData.Selection.push(sel);
                    }
                }
            }
            else if( type == 'CheckBox' ){
                let sel = {};
                sel.SelName = $($(this).find('input')).attr('id');
                sel.Kind = 'P';
                sel.Sign = 'I';
                sel.SelOption = 'EQ';
                sel.Low = $($(this).find('input')).is(":checked") ? 'X' : '';
                sel.High = '';

                reportData.Selection.push(sel);
            }
            else if( type == 'Radio' ){
                let idname = $('input[name='+$(this).attr('data-name')+']:checked').val();

                let allradcontrols = $(this).find('input[type=radio]');
                allradcontrols.each(function(){
                    let sel = {};
                    sel.SelName = $(this).attr('id');
                    sel.Kind = 'P';
                    sel.Sign = 'I';
                    sel.SelOption = 'EQ';
                    sel.Low = (idname == $(this).attr('id')? 'X' : '');
                    sel.High = '';

                    reportData.Selection.push(sel);
                });
            }
        });

        reportData = SoldtoPartyLeadingZeroApply(reportData);
        
        return JSON.stringify(reportData);
    }

    function ProcessLastQueue(data)
    {
        var q = data[0];
        if(q.Status == 1) {

            if(q.OutputType == "Module") {

                dvResultALV.show();
                dvResultFile.hide();
                
                GetResultHeader();
                GetALVSchema_item();
                GetALVSchema_detail();
                
                ShowResult(true);
                ShowLoading(false);
            }
            else if(q.OutputType == "ALV") {

                dvResultALV.show();
                dvResultFile.hide();
                
                let dvHdr = $('#dvResultHeader');
                dvHdr.empty();
                if(alvgrid_item != null) {
                    alvgrid_item.data("kendoGrid").destroy();
                    alvgrid_item.empty();
                    alvgrid_item = null;
                }
                let dvalvgrid_item = $("#gridResult_Item");
                dvalvgrid_item.css('height', '');

                GetALVSchema_detail();
                
                ShowResult(true);
                ShowLoading(false);
            }
            else if(q.OutputType == "File") {
                GetExportData();
            }
            else {
                dvResultALV.hide();
                dvResultFile.hide();

                alert("Error, unknown Output Type ["+q.OutputType+"]");
            }
        }
        else if(q.Status == 0) {
            if(QueueWaitReturn >= MaxWaitQueue) {
                alert("Waiting too long, please check back later at History Queue.");
                ShowLoading(false);
            }
            else {
                QueueWaitReturn += RetryInterval;
                setTimeout(GetLastQueue, RetryInterval);
            }
        }
        else {
            alert(q.LogMessage);
            ShowLoading(false);
        }
    }

    function GetExportData() 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "../../Reports/SapReport.ashx",
            data: {
                Action: "getfiledata",
                Token: AccessToken,
                FuncID: FuncID,
                Report: ReportName,
                QID: lastQueueID         
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText);
                alert(request.statusText);
            },
            success: function (data) {
                ShowLoading(false);
                DataToDownloadFile(data);
            }
        });
    }

    function GetLastQueue() 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "../../Reports/SapReport.ashx",
            data: {
                Action: "getqueue",
                Token: AccessToken,
                FuncID: FuncID,
                Report: ReportName,
                QID: lastQueueID         
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText);
                alert(request.statusText);
            },
            success: function (data) {
                ProcessLastQueue(data.ListData);
            }
        });
    }

    function CreateNewReport(data, reportName) 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "../../Reports/SapReport.ashx",
            data: {
                Action: "new",
                Token: AccessToken,
                FuncID: FuncID,
                Report: reportName,
                Hidden: true,
                Data: data         
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText);
                alert(request.statusText);
            },
            success: function (data) {

                if(selectAddtoQueue == 1) {
                    PushNotification(data.Data);
                    alert("Add to Queue Success!");
                }
                else if(selectAddtoQueue == 2) {
                    PushNotificationEmail(data.Data);
                    alert("Send to Email Success!");
                }
                else {
                    ShowLoading(true);
                    lastQueueID = data.Data;
                    lastDisplayQueueID = data.Data;
                    QueueWaitReturn = 0;
                    GetLastQueue();
                }

            },
            complete: function() {
                DisableSubmit(false);
            }
            
        });
    }

    function CreateNewExport(data, reportName) 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "../../Reports/ZMM198/api.ashx",
            data: {
                Action: "export",
                Token: AccessToken,
                FuncID: FuncID,
                Report: reportName,
                Hidden: true,
                Data: lastDisplayQueueID,
                QID_data: lastDisplayQueueID  
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText);
                alert(request.statusText);
            },
            success: function (data) {

                ShowLoading(true);
                lastQueueID = data.Data;
                QueueWaitReturn = 0;
                GetLastQueue();
            },
            complete: function() {
                DisableSubmit(false);
            }
            
        });
    }

    function GetReportConfig(rptName) 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "../../Reports/SapReport.ashx",
            data: {
                Action: "getconfig",
                Token: AccessToken,
                FuncID: FuncID,
                Report: rptName,
                Data: ''         
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText);
                alert(request.statusText);
            },
            success: function (data) {
                InitReportConfig(data);
            }
        });
    }

    function GetResultHeader() 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "../../Reports/SapReport.ashx",
            data: {
                Action: "getalvdata",
                Token: AccessToken,
                FuncID: FuncID,
                Report: "ZRMM198_SO_Header",
                QID: lastQueueID      
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText);
                alert(request.statusText);
            },
            success: function (data) {
                InitResultDvHeader(data);
            }
        });
    }

    function GetALVSchema_detail() 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "../../Reports/SapReport.ashx",
            data: {
                Action: "getalvschema",
                Token: AccessToken,
                FuncID: FuncID,
                Report: "ZRMM198_Detail",
                QID: lastQueueID      
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText);
                alert(request.statusText);
            },
            success: function (data) {
                InitALVGrid_Detail(data);
            }
        });
    }

    function GetALVSchema_item() 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "../../Reports/SapReport.ashx",
            data: {
                Action: "getalvschema",
                Token: AccessToken,
                FuncID: FuncID,
                Report: "ZRMM198_SO_Item",
                QID: lastQueueID      
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText);
                alert(request.statusText);
            },
            success: function (data) {
                InitALVGrid_Item(data);
            }
        });
    }

    function GetFavorList(callback)
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "../../Favourite.ashx",
            data: {
                Action: "getall",
                Token: AccessToken,
                User: UserName      
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText);
                alert(request.statusText);
            },
            success: function (data) {
                callback(data);
            }
        }); 
    }

    function ToggleFavorStar(functionID) 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "../../Favourite.ashx",
            data: {
                Action: "toggle",
                Token: AccessToken,
                User: UserName,
                FuncID: functionID         
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            complete: function (data) {
                console.log('toggle favor');
                window.parent.postMessage("[UpdateFavor]Ready", "*");
            }
        }); 
    }

    function UpdateFuncAccess(functionID) 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "../../Favourite.ashx",
            data: {
                Action: "updacess",
                Token: AccessToken,
                User: UserName,
                FuncID: functionID         
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            complete: function (data) {

            }
        }); 
    }

    function PushNotification(qid) 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "../../Notification/Notification.ashx",
            data: {
                Action: "addnotification",
                Token: AccessToken,
                User: UserName,
                QID: qid         
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            complete: function (data) {

            }
        }); 
    }

    function PushNotificationEmail(qid) 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "../../Notification/Notification.ashx",
            data: {
                Action: "addnotificationEmail",
                Token: AccessToken,
                User: UserName,
                QID: qid         
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            complete: function (data) {

            }
        }); 
    }

    
    function DownloadALVFileData(layoutcontent) 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "../../Reports/SapReport.ashx",
            data: {
                Action: "downloadalvdata",
                Token: AccessToken,
                FuncID: FuncID,
                Report: ReportDisplayName,
                LayoutContent: layoutcontent,
                QID:  lastQueueID
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText);
                alert(request.statusText);
            },
            success: function (resultset) {
                DataToDownloadFile(resultset);
            }
        });
    }

    function SoldtoPartyLeadingZeroApply(reportData)
    {
        for(var i=0; i<reportData.Selection.length; i++){
            var item = reportData.Selection[i];
            if(item.SelName == "S_KUNNR") {
                if(item.SelOption != "CP") {
                    if(item.Low != null && item.Low.length < 10 && item.Low.length > 1) {
                        let s = "0000000000" + item.Low;
                        item.Low = s.substr(s.length-10);
                    }
                    if(item.High != null && item.High.length < 10 && item.High.length > 1) {
                        let s = "0000000000" + item.High;
                        item.High = s.substr(s.length-10);
                    }
                }
            }
        }

        return reportData;
    }
}

function DataToDownloadFile(fileset) {
    for(var f=0; f<fileset.length; f++)
    {
        var result = fileset[f];
        var base64 = atob(result.FileDataBase64);
        var buffer = new ArrayBuffer(base64.length);
        var u8ary = new Uint8Array(buffer);
        for (var i = 0; i < base64.length; i++) {
            u8ary[i] = base64.charCodeAt(i) & 0xFF;
        }

        var blob = new Blob([buffer]);
        kendo.saveAs({
            dataURI: blob,
            fileName: result.FileName
        });
    }
}
