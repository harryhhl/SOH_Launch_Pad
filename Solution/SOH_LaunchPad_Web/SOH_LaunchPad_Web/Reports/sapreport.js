'use strict';

Start();

function Start() 
{
    const MaxWaitQueue = 30000;
    const RetryInterval = 1000;

    const urlParams = new URLSearchParams(window.location.search);
    var ReportName = urlParams.get('rn');
    var ReportDisplayName = decodeURIComponent(urlParams.get('rptdname'));
    var FuncID = urlParams.get('fid');
    var AccessToken = localStorage.getItem('SOH_Token');
    var UserName = localStorage.getItem('SOH_Username');

    var QueueWaitReturn = 0;
    var alvgridDataSource = null;
    var alvgrid = null;

    var lastQueueID = null;
    var reportconfigready = false;

    var dvResultALV = null;
    var dvResultFile = null;

    var selectAddtoQueue = 0;

    $(document).ready(Begin);

    function Begin()
    {
        GetReportConfig();
        InitOthers();
        CheckInitReady();
    }

    function CheckInitReady()
    {
        if(reportconfigready==true) {
            kendo.fx($("#dvLoadingOverlay")).fade("out").play();
        }
        else {
            setTimeout(CheckInitReady, 500);
        }
    }

    function InitOthers()
    {
        dvResultALV = $('#dvResultPanel_ALV');
        dvResultFile = $('#dvResultPanel_File');

        $('#lbRptName').empty();
        $('#lbRptName').append("<h3>"+ReportDisplayName+"</h3>");

        $('#btnDownloadFile').on( 'click', function(){
            if(lastQueueID.length > 0) {
                DownloadFileData();
            }
        });

        $('#btnBack').on( 'click', function() {           
            ShowResult(false);
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

            if(item.ControlType == "CheckBox") {
                htmlContent += '<div class="sspcontrol" type="CheckBox">';
                htmlContent += '  <div>';
                htmlContent += '    <input type="checkbox" class="k-checkbox" id="'+item.SelName+'" '+(item.DefaultValue=="X"?'checked':'')+'>';
                htmlContent += '    <label class="k-checkbox-label" for="'+item.SelName+'">'+item.SelDesc+'</label>';
                htmlContent += '  </div>';
                htmlContent += '</div>';
            }
            else if(item.ControlType == "Range" && item.DataType == "C") {
                htmlContent += '<div class="sspcontrol" type="Range" style="display:flex; align-items:center; flex-wrap: wrap" '+(item.IsRestrict=="1"?'CheckRestrict':'')+'>';
                htmlContent += '  <div class="sspcontrol-Range"><label for="'+item.SelName+'-low" class="sspcontrol-desc">'+item.SelDesc+'</label></div>';
                htmlContent += '  <div class="sspcontrol-Range"><input id="'+item.SelName+'-low" name="'+item.SelName+'-From" class="k-textbox" maxlength="'+item.Length+'" '+(item.IsMandatory==1?' required ':'')+'></div>';
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
                htmlContent += '  <div class="sspcontrol-Range"><label for="'+item.SelName+'-low" class="sspcontrol-desc">'+item.SelDesc+'</label></div>';
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
            else if(item.ControlType == "Range" && item.DataType == "N" & item.Length == 8) {
                htmlContent += '<div class="sspcontrol" type="RangeDate" style="display:flex; align-items:center; flex-wrap: wrap;" date-format="yyyy0MM">';
                htmlContent += '  <div class="sspcontrol-Range"><label for="'+item.SelName+'-low" class="sspcontrol-desc">'+item.SelDesc+'</label></div>';
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
            // else if(item.ControlType == "Range" && item.DataType == "N") {
            //     htmlContent += '<div class="sspcontrol" type="RangeNum" style="display:flex; align-items:center; flex-wrap: wrap">';
            //     htmlContent += '  <div class="sspcontrol-Range"><label for="'+item.SelName+'-low" class="sspcontrol-desc">'+item.SelDesc+'</label></div>';
            //     htmlContent += '  <div class="sspcontrol-Range"><input id="'+item.SelName+'-low" name="'+item.SelName+'-From" type="numeric" data-format="n" data-length="'+item.Length+'" data-decimal="'+item.Decimal+'" '+(item.IsMandatory==1?' required ':'')+'></div>';
            //     htmlContent += '  <div class="sspcontrol-Range"><label for="'+item.SelName+'-high" style="margin-left:2em">to </label></div>';
            //     htmlContent += '  <div class="sspcontrol-Range"><input id="'+item.SelName+'-high" name="'+item.SelName+'-To" type="numeric" data-format="n" data-length="'+item.Length+'" data-decimal="'+item.Decimal+'" data-comparevalid-field1="'+item.SelName+'-compare" data-comparevalid-field2="'+item.SelName+'-From"></div>';
            //     htmlContent += '  <div class="sspcontrol-Range" style="margin-left:2em">';
            //     htmlContent += '    <select name="'+item.SelName+'-compare">';
            //     htmlContent += '      <option value="BT">Between</option>';
            //     htmlContent += '      <option value="EQ">Equal</option>';
            //     htmlContent += '      <option value="GE">Greater or Equal</option>';
            //     htmlContent += '      <option value="LE">Less or Equal</option>';
            //     htmlContent += '      <option value="GT">Greater</option>';
            //     htmlContent += '      <option value="LT">Less</option>';
            //     htmlContent += '      <option value="NE">Not Equal</option>';
            //     htmlContent += '      <option value="NB">Not Between</option>';
            //     htmlContent += '   </select>';
            //     htmlContent += '  </div>';
            //     htmlContent += '</div>';

            //     invalidateContent += '<div><span data-for="'+item.SelName+'-From" class="k-invalid-msg"></span></div>';
            //     invalidateContent += '<div><span data-for="'+item.SelName+'-To" class="k-invalid-msg"</span></div>';
            // }   
            else if(item.ControlType == "Range" && item.DataType == "P") {
                htmlContent += '<div class="sspcontrol" type="RangeNum" style="display:flex; align-items:center; flex-wrap: wrap">';
                htmlContent += '  <div class="sspcontrol-Range"><label for="'+item.SelName+'-low" class="sspcontrol-desc">'+item.SelDesc+'</label></div>';
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
                    htmlContent += '  <div class="sspcontrol-Text"><label for="'+item.SelName+'" class="sspcontrol-desc">'+item.SelDesc+'</label></div>';
                    htmlContent += '  <div class="sspcontrol-Text"><input id="'+item.SelName+'" name="'+item.SelName+'" class="k-textbox" style="width:'+Math.min(item.Length+3, document.body.clientWidth * 0.7 / parseFloat($("body").css("font-size")))+'ch" value="'+item.DefaultValue+'" maxlength="'+item.Length+'"' +(item.IsMandatory==1?' required ':'')+'></div>';
                    htmlContent += '</div>'; 

                    invalidateContent += '<div><span data-for="'+item.SelName+'-From" class="k-invalid-msg"></span></div>';
                }
            }   
            else if(item.ControlType == "ComboBox" && item.DataType == "C") {
                htmlContent += '<div class="sspcontrol" type="ComboBox" style="display:flex; align-items:center; flex-wrap: wrap" '+(item.IsRestrict=="1"?'CheckRestrict':'')+'>';
                htmlContent += '  <div class="sspcontrol-Range"><label for="'+item.SelName+'-low" class="sspcontrol-desc">'+item.SelDesc+'</label></div>';
                htmlContent += '  <div class="sspcontrol-Range"><input id="'+item.SelName+'-low" name="'+item.SelName+'-From" type="comboS" mstsrc="'+item.MstSource+'" maxlength="'+item.Length+'" '+(item.IsMandatory==1?' required ':'')+'></div>';
                htmlContent += '</div>';

                invalidateContent += '<div><span data-for="'+item.SelName+'-From" class="k-invalid-msg"></span></div>';
            }               
            else if(item.ControlType == "ComboBoxRange" && item.DataType == "C") {
                htmlContent += '<div class="sspcontrol" type="RangeCbx" style="display:flex; align-items:center; flex-wrap: wrap" '+(item.IsRestrict=="1"?'CheckRestrict':'')+'>';
                htmlContent += '  <div class="sspcontrol-Range"><label for="'+item.SelName+'-low" class="sspcontrol-desc">'+item.SelDesc+'</label></div>';
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
                htmlContent += '  <div class="sspcontrol-Range"><label for="'+item.SelName+'-low" class="sspcontrol-desc">'+item.SelDesc+'</label></div>';
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
        // htmlContent += '<li>';
        // htmlContent += '   <div class="ss-loadingbar">';
        // htmlContent += '       <progress></progress>';
        // htmlContent += '   </div>';
        // htmlContent += '</li>';
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
                //dateInput: true
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
            $(this).kendoComboBox({
                filter:"contains",
                dataTextField: "Code",
                dataValueField: "Code",
                headerTemplate: '',
                template:   '<span style="display: table-row;">' + 
                            '<span style="display: table-cell; width: 115px">#=data.Code#</span>' + 
                            '<span style="display: table-cell; min-width: 140px">#=data.Description#</span></span>',
                dataSource: {
                    transport: {
                        read: {
                            url: "SapReport.ashx",
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
                                MstName: $(this).attr('mstsrc')         
                            },
                            error: function (xhr, error) {
                                console.debug(xhr); console.debug(error);
                            }
                        },
                        cache: "inmemory"
                    }
                },
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
                autoWidth: true,
                height: 400,
                animation: false
            });
        });        

        var selectRangeMulSelectControls = $('#dvNewCallContent input[type=comboM]');
        selectRangeMulSelectControls.each(function(){
            $(this).kendoMultiSelect({
                filter:"contains",
                dataTextField: "Code",
                dataValueField: "Code",
                headerTemplate: '',
                template:   '<span style="display: table-row;">' + 
                            '<span style="display: table-cell; width: 115px">#=data.Code#</span>' + 
                            '<span style="display: table-cell; min-width: 140px">#=data.Description#</span></span>',
                dataSource: {
                    transport: {
                        read: {
                            url: "SapReport.ashx",
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
                                MstName: $(this).attr('mstsrc')         
                            },
                            error: function (xhr, error) {
                                console.debug(xhr); console.debug(error);
                            }
                        },
                        cache: "inmemory"
                    }
                },
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
                autoWidth: true,
                height: 400,
                animation: false
            });
        });
        
        // $('#btnOpenNewCall').on( 'click', function(){
        //     $('#btnSubmit').removeAttr('disabled');
        //     $('#btnCancel').removeAttr('disabled');
        //     $('.ss-loadingbar').hide();
        //     kendo.fx($("#dvNewCall")).fade("in").play();
        // });

        // $('#btnCancel').on( 'click', function(){
        //     kendo.fx($("#dvNewCall")).fade("out").play();
        // });

        var $checkboxes = $('#dvNewCallContent input[type=checkbox]');
        $checkboxes.change(function(){
            typeof $(this).attr('checked') == "undefined" ? $(this).attr('checked', 'checked') : $(this).removeAttr('checked');
        });

        $('#btnSubmit').on( 'click', function() {           
            selectAddtoQueue = 0;
            $("#btnSubmitHidden").click();
            UpdateFuncAccess(FuncID);
        });
        
        $('#btnAddQueue').on( 'click', function() {
            selectAddtoQueue = 1;
            $("#btnSubmitHidden").click();
            UpdateFuncAccess(FuncID);
        });

        $('#btnAddEmail').on( 'click', function() {
            selectAddtoQueue = 2;
            $("#btnSubmitHidden").click();
            UpdateFuncAccess(FuncID);
        });

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
                // comparevalid: function (input) {
                //     var value = $(input).val();
                //     if (input.is("[data-comparevalid-field1]") && value == "") {                                    
                //         var compare = $("[name='" + input.data("comparevalidField1") + "']").val();
                //         if (compare == "BT" || compare == "NT") {
                //             var fromValue = $("[name='" + input.data("comparevalidField2") + "']").val();
                //             if(fromValue != "")
                //                 return false;
                //         }
                //     }

                //     return true;
                // }
            },
            messages: {
                required: "This field is required",
                dateValidation: "Invalid date format",
                multiSelectValid: "This field is required, select at least one",
                comparevalid: "[To] value cannot be empty when choose [Between] or [Not Between] "
            }
        });

        $("#inputForm").submit(function(event) {
            event.preventDefault();
            var validator = $("#inputForm").kendoValidator().data("kendoValidator");
            if (validator.validate()) {
                DisableSubmit(true);
                var reportData = BuildReportSelection();
                CreateNewReport(reportData);
            } else {
                alert("Oops! There is invalid data in the form.");
            }
        });

        reportconfigready = true;
    }

    function GetMSFilterbyDependant(dependant) 
    {
        var filterObject = new Object();
        var filterList = new Array();

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
            
        }
        else {
            $('#dvNewCallContent').show();
            $('#btnAddQueue').show();
            $('#btnAddEmail').show();
            $('#btnSubmit').show();
            $('#btnBack').hide();
            dvResultALV.hide();
            dvResultFile.hide();
        }
    }


    function InitALVGrid(config)
    {
        alvgridDataSource = new kendo.data.DataSource({
            type: "json",
            transport: {
                read: {
                    url: "SapReport.ashx",
                    dataType: "json",
                    type: "POST",
                    contentType: "application/json; charset=utf-8",
                    xhrFields: {
                        withCredentials: true
                    },
                    data: ALVGridDataSourceFilter,
                    complete: ALVGridGetDataReturn,
                    error: function (xhr, error) {
                        console.debug(xhr); console.debug(error);
                    }
                }
            },
            schema: {
                model: {
                    id: "Id",
                    fields: JSON.parse(config.SchemaSetting)
                },
                data: "ListData",
                total: "TotalCount"
            },
            pageSize: 10,
            serverPaging: false,
            serverFiltering: false,
            serverSorting: false
        });

        alvgrid = $("#gridResult").kendoGrid({
            autoBind: false,
            dataSource: alvgridDataSource,
            height: window.parent.innerHeight - 300,
            theme: "default",
            sortable: true,
            reorderable: true,
            groupable: true,
            resizable: true,
            filterable: {
                mode: "row"
            },
            columnMenu: true,
            selectable: "row",
            pageable: false,
            excel: {
                allPages: true
            },
            columns: JSON.parse(config.ColumnSetting)
        });     
        
        //var gridData = histgrid.data("kendoGrid");
        $('.btnDownloadExcel').on( 'click', function() {
            var grid = alvgrid.data("kendoGrid");
            grid.saveAsExcel();
        });

        ALVGridReload();
    }

    function ALVGridReload() 
    {
        alvgridDataSource.read();
    }

    function ALVGridDataSourceFilter()
    {
        var results = {};

        results.Action = "getalvdata";
        results.Token = AccessToken;
        results.FuncID = FuncID;
        results.Report = ReportName;
        results.QID = lastQueueID;

        return results;
    }

    function ALVGridGetDataReturn(_jqXHR, _textStatus) 
    {
        var grid = alvgrid.data("kendoGrid");
        var total = grid.dataSource.total();
        if(total > 0) {
            grid.dataSource.pageSize(total);
            //grid.dataSource.page(1);
            grid.refresh();
            //grid.pager.refresh();
        }
    }

    function BuildReportSelection()
    {
        var controls = $('#dvNewCallContent').find('.sspcontrol');

        var reportData = new Object();
        reportData.ReportName = ReportName;
        reportData.Selection = [];
        
        controls.each(function(){
            var type = $(this).attr('type');
            var checkRestrict = $(this).attr('CheckRestrict');
            if(type == 'Range') {
                var sel = new Object();
                sel.SelName = $($(this).find('input')[0]).attr('id').split('-')[0];
                sel.Kind = 'S';
                sel.Sign = 'I';
                sel.SelOption = $($(this).find('select')[0]).val();
                sel.Low = $($(this).find('input')[0]).val();
                sel.High = $($(this).find('input')[1]).val();

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
            else if(type == 'RangeNum') {
                var sel = new Object();
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
                var sel = new Object();
                sel.SelName = $($(this).find('input')[0]).attr('id').split('-')[0];
                sel.Kind = 'S';
                sel.Sign = 'I';
                sel.SelOption = $($(this).find('select')[0]).val();

                var dateformat = $(this).attr('date-format');
                var datefrom = $($(this).find('input')[0]).data("kendoDatePicker").value();
                var dateto = $($(this).find('input')[1]).data("kendoDatePicker").value();
                sel.Low = kendo.toString(datefrom, dateformat);
                sel.High = kendo.toString(dateto, dateformat);

                if(sel.High == null && (sel.SelOption == "BT" || sel.SelOption == "NT"))
                    sel.SelOption = "EQ";

                if(sel.Low != null || sel.High != null)
                    reportData.Selection.push(sel);
            }           
            else if(type == 'RangeCbx') {
                var sel = new Object();
                sel.SelName = $($(this).find('input')[1]).attr('id').split('-')[0];
                sel.Kind = 'S';
                sel.Sign = 'I';
                sel.SelOption = $($(this).find('select')[0]).val();

                var from = $($(this).find('input')[1]).data("kendoComboBox").value();
                var to = $($(this).find('input')[3]).data("kendoComboBox").value();
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
                var sel = new Object();
                sel.SelName = $($(this).find('input')[1]).attr('id').split('-')[0];
                sel.Kind = 'S';
                sel.Sign = 'I';
                sel.SelOption = $($(this).find('select')[0]).val();

                var fromVals = $($(this).find('input')[1]).data("kendoMultiSelect").value();
                var toVals = $($(this).find('input')[3]).data("kendoMultiSelect").value();
                                
                for(var i=0; i<fromVals.length; i++) {
                    var item = new Object();
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
                var sel = new Object();
                sel.SelName = $($(this).find('input')[1]).attr('id').split('-')[0];
                sel.Kind = 'S';
                sel.Sign = 'I';
                sel.SelOption = 'EQ';

                var from = $($(this).find('input')[1]).data("kendoComboBox").value();
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
            else if( type == 'Text' ){
                var sel = new Object();
                sel.SelName = $($(this).find('input')).attr('id');
                sel.Kind = 'P';
                sel.Sign = 'I';
                sel.SelOption = 'EQ';
                sel.Low = $($(this).find('input')).val();
                sel.High = '';

                if(sel.Low.length > 0) {
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
                var sel = new Object();
                sel.SelName = $($(this).find('input')).attr('id');
                sel.Kind = 'P';
                sel.Sign = 'I';
                sel.SelOption = 'EQ';
                sel.Low = $($(this).find('input')).attr('checked') ? 'X' : '';
                sel.High = '';

                reportData.Selection.push(sel);
            }
            else if( type == 'Radio' ){
                var idname = $('input[name='+$(this).attr('data-name')+']:checked').val();

                var allradcontrols = $(this).find('input[type=radio]');
                allradcontrols.each(function(){
                    var sel = new Object();
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
        
        return JSON.stringify(reportData);
    }

    function ProcessLastQueue(data)
    {
        var q = data[0];
        if(q.Status == 1) {

            if(q.OutputType == "ALV") {

                dvResultALV.show();
                dvResultFile.hide();
    
                GetALVSchema();
            }
            else if(q.OutputType == "File") {
                dvResultALV.hide();
                dvResultFile.show();
            }
            else {
                dvResultALV.hide();
                dvResultFile.hide();

                alert("Error, unknown Output Type ["+q.OutputType+"]");
            }

            kendo.fx($("#dvLoadingOverlay")).fade("out").play();
            ShowResult(true);
        }
        else if(q.Status == 0) {
            if(QueueWaitReturn >= MaxWaitQueue) {
                alert("Waiting too long, please check back later at History Queue.");
                kendo.fx($("#dvLoadingOverlay")).fade("out").play();
            }
            else {
                QueueWaitReturn += RetryInterval;
                setTimeout(GetLastQueue, RetryInterval);
            }
        }
        else {
            alert(q.LogMessage);
            kendo.fx($("#dvLoadingOverlay")).fade("out").play();
        }
    }

    
    function GetLastQueue() 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "SapReport.ashx",
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

    function CreateNewReport(data) 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "SapReport.ashx",
            data: {
                Action: "new",
                Token: AccessToken,
                FuncID: FuncID,
                Report: ReportName,
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
                    kendo.fx($("#dvLoadingOverlay")).fade("in").play();
                    lastQueueID = data.Data;
                    QueueWaitReturn = 0;
                    GetLastQueue();
                }
            },
            complete: function() {
                DisableSubmit(false);
            }
            
        });
    }

    function GetReportConfig() 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "SapReport.ashx",
            data: {
                Action: "getconfig",
                Token: AccessToken,
                FuncID: FuncID,
                Report: ReportName,
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

    function GetALVSchema() 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "SapReport.ashx",
            data: {
                Action: "getalvschema",
                Token: AccessToken,
                FuncID: FuncID,
                Report: ReportName,
                Data: ''      
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText);
                alert(request.statusText);
            },
            success: function (data) {
                InitALVGrid(data);
            }
        });
    }

    function DownloadFileData() 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "SapReport.ashx",
            data: {
                Action: "getfiledata",
                Token: AccessToken,
                FuncID: FuncID,
                Report: ReportName,
                Data: '',
                QID:  lastQueueID
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText);
                alert(request.statusText);
            },
            success: function (result) {
                var base64 = atob(result.FileDataBase64);
                var buffer = new ArrayBuffer(base64.length);
                var u8ary = new Uint8Array(buffer);
                for (var i = 0; i < base64.length; i++) {
                    u8ary[i] = base64.charCodeAt(i) & 0xFF;
                }

                DataToDownloadFile(buffer, result.FileName);
            }
        });
    }

    function GetFavorList(callback)
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "../Favourite.ashx",
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
            url: "../Favourite.ashx",
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
            url: "../Favourite.ashx",
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
            url: "../Notification/Notification.ashx",
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
            url: "../Notification/Notification.ashx",
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
}

function DataToDownloadFile(data, fileName) {
    var file = new Blob([data]);
    if ("msSaveBlob" in window.navigator) {
        window.navigator.msSaveBlob(file, fileName);
    } else {
        var dUrl = window.URL.createObjectURL(file);
        var link = document.createElement("a");
        link.href = dUrl;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(dUrl);
    }
}