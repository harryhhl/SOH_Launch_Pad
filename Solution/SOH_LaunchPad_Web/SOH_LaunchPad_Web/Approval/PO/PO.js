'use strict';

Start();

function Start() {
    const urlParams = new URLSearchParams(window.location.search);
    var FuncDisplayName = decodeURIComponent(urlParams.get('fname'));
    var FuncID = urlParams.get('fid');
    var AccessToken = localStorage.getItem('SOH_Token');
    var UserName = localStorage.getItem('SOH_Username');

    var ActingApprover = "";

    var resultgridDataSource = null;
    var resultgrid = null;

    var kwPDFViewer = null;

    var selectedDetailSID = null;
    var selectedRst = null;

    var kdApproveDialog = null;

    $(document).ready(Begin);

    function Begin() {

        GetActingApprover();
        InitInputSection();
        InitOthers();
    }

    function ShowLoading(show) {
        if (show)
            kendo.fx($("#dvLoadingOverlay")).fade("in").play();
        else
            kendo.fx($("#dvLoadingOverlay")).fade("out").play();
    }

    function InitInputSection() {
        const dvContent = $('#dvNewCallContent');
        let htmlContent = '<form id="inputForm">';

        htmlContent += "<ul>";

        
        htmlContent += "<li>";
        htmlContent += '<div class="sspcontrol" type="Range" style="display:flex; align-items:center; flex-wrap: wrap">';
        htmlContent += '  <div class="sspcontrol-Range"><label for="I_R_REL_CODE-low" class="sspcontrol-desc">Release Code</label></div>';
        htmlContent += '  <div class="sspcontrol-Range"><input id="I_R_REL_CODE-low" name="I_R_REL_CODE-From" class="k-textbox"></div>';
        htmlContent += '  <div class="sspcontrol-Range"><label for="I_R_REL_CODE-high">to </label></div>';
        htmlContent += '  <div class="sspcontrol-Range"><input id="I_R_REL_CODE-high" name="I_R_REL_CODE-To" class="k-textbox" maxlength="10" data-comparevalid-field1="I_R_REL_CODE-compare" data-comparevalid-field2="I_R_REL_CODEFrom"></div>';
        htmlContent += '  <div class="sspcontrol-Range">';
        htmlContent += '      <select name="I_R_REL_CODE-compare">';
        htmlContent += '        <option value="BT">Between</option>';
        htmlContent += '        <option value="EQ">Equal</option>';
        htmlContent += '        <option value="GE">Greater or Equal</option>';
        htmlContent += '        <option value="LE">Less or Equal</option>';
        htmlContent += '        <option value="GT">Greater</option>';
        htmlContent += '        <option value="LT">Less</option>';
        htmlContent += '        <option value="NE">Not Equal</option>';
        htmlContent += '        <option value="NB">Not Between</option>';
        htmlContent += '      </select>';
        htmlContent += '  </div>';
        htmlContent += '</div>';
        htmlContent += "</li>";

        htmlContent += "<li>";
        htmlContent += '<div class="sspcontrol" type="Range" style="display:flex; align-items:center; flex-wrap: wrap">';
        htmlContent += '  <div class="sspcontrol-Range"><label for="I_R_REL_GROUP-low" class="sspcontrol-desc">Release Group</label></div>';
        htmlContent += '  <div class="sspcontrol-Range"><input id="I_R_REL_GROUP-low" name="I_R_REL_GROUP-From" class="k-textbox"></div>';
        htmlContent += '  <div class="sspcontrol-Range"><label for="I_R_REL_GROUP-high">to </label></div>';
        htmlContent += '  <div class="sspcontrol-Range"><input id="I_R_REL_GROUP-high" name="I_R_REL_GROUP-To" class="k-textbox" maxlength="10" data-comparevalid-field1="I_R_REL_GROUP-compare" data-comparevalid-field2="I_R_REL_GROUPFrom"></div>';
        htmlContent += '  <div class="sspcontrol-Range">';
        htmlContent += '      <select name="I_R_REL_GROUP-compare">';
        htmlContent += '        <option value="BT">Between</option>';
        htmlContent += '        <option value="EQ">Equal</option>';
        htmlContent += '        <option value="GE">Greater or Equal</option>';
        htmlContent += '        <option value="LE">Less or Equal</option>';
        htmlContent += '        <option value="GT">Greater</option>';
        htmlContent += '        <option value="LT">Less</option>';
        htmlContent += '        <option value="NE">Not Equal</option>';
        htmlContent += '        <option value="NB">Not Between</option>';
        htmlContent += '      </select>';
        htmlContent += '  </div>';
        htmlContent += '</div>';
        htmlContent += "</li>";

        htmlContent += '<div class="sspcontrol" type="CheckBox">';
        htmlContent += '  <div>';
        htmlContent += '    <input type="checkbox" class="k-checkbox" id="I_SET" checked>';
        htmlContent += '    <label class="k-checkbox-label" for="I_SET">Set release</label>';
        htmlContent += '  </div>';
        htmlContent += '</div>';
        
        htmlContent += '<div class="sspcontrol" type="CheckBox">';
        htmlContent += '  <div>';
        htmlContent += '    <input type="checkbox" class="k-checkbox" id="I_CANCEL">';
        htmlContent += '    <label class="k-checkbox-label" for="I_CANCEL">Cancel release</label>';
        htmlContent += '  </div>';
        htmlContent += '</div>';

        htmlContent += "<li>";
        htmlContent += '<div class="sspcontrol" type="Range" style="display:flex; align-items:center; flex-wrap: wrap">';
        htmlContent += '  <div class="sspcontrol-Range"><label for="I_R_PO_ORG-low" class="sspcontrol-desc">Purchasing organization</label></div>';
        htmlContent += '  <div class="sspcontrol-Range"><input id="I_R_PO_ORG-low" name="I_R_PO_ORG-From" class="k-textbox"></div>';
        htmlContent += '  <div class="sspcontrol-Range"><label for="I_R_PO_ORG-high">to </label></div>';
        htmlContent += '  <div class="sspcontrol-Range"><input id="I_R_PO_ORG-high" name="I_R_PO_ORG-To" class="k-textbox" maxlength="10" data-comparevalid-field1="I_R_PO_ORG-compare" data-comparevalid-field2="I_R_PO_ORGFrom"></div>';
        htmlContent += '  <div class="sspcontrol-Range">';
        htmlContent += '      <select name="I_R_PO_ORG-compare">';
        htmlContent += '        <option value="BT">Between</option>';
        htmlContent += '        <option value="EQ">Equal</option>';
        htmlContent += '        <option value="GE">Greater or Equal</option>';
        htmlContent += '        <option value="LE">Less or Equal</option>';
        htmlContent += '        <option value="GT">Greater</option>';
        htmlContent += '        <option value="LT">Less</option>';
        htmlContent += '        <option value="NE">Not Equal</option>';
        htmlContent += '        <option value="NB">Not Between</option>';
        htmlContent += '      </select>';
        htmlContent += '  </div>';
        htmlContent += '</div>';
        htmlContent += "</li>";


        htmlContent += "<li>";
        htmlContent += '<div class="sspcontrol" type="Range" style="display:flex; align-items:center; flex-wrap: wrap">';
        htmlContent += '  <div class="sspcontrol-Range"><label for="I_R_PO-low" class="sspcontrol-desc">PO No.</label></div>';
        htmlContent += '  <div class="sspcontrol-Range"><input id="I_R_PO-low" name="I_R_PO-From" class="k-textbox"></div>';
        htmlContent += '  <div class="sspcontrol-Range"><label for="I_R_PO-high">to </label></div>';
        htmlContent += '  <div class="sspcontrol-Range"><input id="I_R_PO-high" name="I_R_PO-To" class="k-textbox" maxlength="10" data-comparevalid-field1="I_R_PO-compare" data-comparevalid-field2="I_R_POFrom"></div>';
        htmlContent += '  <div class="sspcontrol-Range">';
        htmlContent += '      <select name="I_R_PO-compare">';
        htmlContent += '        <option value="BT">Between</option>';
        htmlContent += '        <option value="EQ">Equal</option>';
        htmlContent += '        <option value="GE">Greater or Equal</option>';
        htmlContent += '        <option value="LE">Less or Equal</option>';
        htmlContent += '        <option value="GT">Greater</option>';
        htmlContent += '        <option value="LT">Less</option>';
        htmlContent += '        <option value="NE">Not Equal</option>';
        htmlContent += '        <option value="NB">Not Between</option>';
        htmlContent += '      </select>';
        htmlContent += '  </div>';
        htmlContent += '</div>';
        htmlContent += "</li>";

        htmlContent += "<li>";
        htmlContent += '<div class="sspcontrol" type="Range" style="display:flex; align-items:center; flex-wrap: wrap">';
        htmlContent += '  <div class="sspcontrol-Range"><label for="I_R_PO_GROUP-low" class="sspcontrol-desc">Purchasing group</label></div>';
        htmlContent += '  <div class="sspcontrol-Range"><input id="I_R_PO_GROUP-low" name="I_R_PO_GROUP-From" class="k-textbox"></div>';
        htmlContent += '  <div class="sspcontrol-Range"><label for="I_R_PO_GROUP-high">to </label></div>';
        htmlContent += '  <div class="sspcontrol-Range"><input id="I_R_PO_GROUP-high" name="I_R_PO_GROUP-To" class="k-textbox" maxlength="10" data-comparevalid-field1="I_R_PO_GROUP-compare" data-comparevalid-field2="I_R_PO_GROUPFrom"></div>';
        htmlContent += '  <div class="sspcontrol-Range">';
        htmlContent += '      <select name="I_R_PO_GROUP-compare">';
        htmlContent += '        <option value="BT">Between</option>';
        htmlContent += '        <option value="EQ">Equal</option>';
        htmlContent += '        <option value="GE">Greater or Equal</option>';
        htmlContent += '        <option value="LE">Less or Equal</option>';
        htmlContent += '        <option value="GT">Greater</option>';
        htmlContent += '        <option value="LT">Less</option>';
        htmlContent += '        <option value="NE">Not Equal</option>';
        htmlContent += '        <option value="NB">Not Between</option>';
        htmlContent += '      </select>';
        htmlContent += '  </div>';
        htmlContent += '</div>';
        htmlContent += "</li>";

        htmlContent += "<li>";
        htmlContent += '<div class="sspcontrol" type="Range" style="display:flex; align-items:center; flex-wrap: wrap">';
        htmlContent += '  <div class="sspcontrol-Range"><label for="I_R_PO_TYPE-low" class="sspcontrol-desc">Document type</label></div>';
        htmlContent += '  <div class="sspcontrol-Range"><input id="I_R_PO_TYPE-low" name="I_R_PO_TYPE-From" class="k-textbox"></div>';
        htmlContent += '  <div class="sspcontrol-Range"><label for="I_R_PO_TYPE-high">to </label></div>';
        htmlContent += '  <div class="sspcontrol-Range"><input id="I_R_PO_TYPE-high" name="I_R_PO_TYPE-To" class="k-textbox" maxlength="10" data-comparevalid-field1="I_R_PO_TYPE-compare" data-comparevalid-field2="I_R_PO_TYPEFrom"></div>';
        htmlContent += '  <div class="sspcontrol-Range">';
        htmlContent += '      <select name="I_R_PO_TYPE-compare">';
        htmlContent += '        <option value="BT">Between</option>';
        htmlContent += '        <option value="EQ">Equal</option>';
        htmlContent += '        <option value="GE">Greater or Equal</option>';
        htmlContent += '        <option value="LE">Less or Equal</option>';
        htmlContent += '        <option value="GT">Greater</option>';
        htmlContent += '        <option value="LT">Less</option>';
        htmlContent += '        <option value="NE">Not Equal</option>';
        htmlContent += '        <option value="NB">Not Between</option>';
        htmlContent += '      </select>';
        htmlContent += '  </div>';
        htmlContent += '</div>';
        htmlContent += "</li>";

        htmlContent += "<li>";
        htmlContent += '<div class="sspcontrol" type="Range" style="display:flex; align-items:center; flex-wrap: wrap">';
        htmlContent += '  <div class="sspcontrol-Range"><label for="I_R_VENDOR-low" class="sspcontrol-desc">Vendor</label></div>';
        htmlContent += '  <div class="sspcontrol-Range"><input id="I_R_VENDOR-low" name="I_R_VENDOR-From" class="k-textbox"></div>';
        htmlContent += '  <div class="sspcontrol-Range"><label for="I_R_VENDOR-high">to </label></div>';
        htmlContent += '  <div class="sspcontrol-Range"><input id="I_R_VENDOR-high" name="I_R_VENDOR-To" class="k-textbox" maxlength="10" data-comparevalid-field1="I_R_VENDOR-compare" data-comparevalid-field2="I_R_VENDORFrom"></div>';
        htmlContent += '  <div class="sspcontrol-Range">';
        htmlContent += '      <select name="I_R_VENDOR-compare">';
        htmlContent += '        <option value="BT">Between</option>';
        htmlContent += '        <option value="EQ">Equal</option>';
        htmlContent += '        <option value="GE">Greater or Equal</option>';
        htmlContent += '        <option value="LE">Less or Equal</option>';
        htmlContent += '        <option value="GT">Greater</option>';
        htmlContent += '        <option value="LT">Less</option>';
        htmlContent += '        <option value="NE">Not Equal</option>';
        htmlContent += '        <option value="NB">Not Between</option>';
        htmlContent += '      </select>';
        htmlContent += '  </div>';
        htmlContent += '</div>';
        htmlContent += "</li>";

        htmlContent += "<li>";
        htmlContent += '<div class="sspcontrol" type="Range" style="display:flex; align-items:center; flex-wrap: wrap">';
        htmlContent += '  <div class="sspcontrol-Range"><label for="I_R_CUSTOMER-low" class="sspcontrol-desc">Customer</label></div>';
        htmlContent += '  <div class="sspcontrol-Range"><input id="I_R_CUSTOMER-low" name="I_R_CUSTOMER-From" class="k-textbox"></div>';
        htmlContent += '  <div class="sspcontrol-Range"><label for="I_R_CUSTOMER-high">to </label></div>';
        htmlContent += '  <div class="sspcontrol-Range"><input id="I_R_CUSTOMER-high" name="I_R_CUSTOMER-To" class="k-textbox" maxlength="10" data-comparevalid-field1="I_R_CUSTOMER-compare" data-comparevalid-field2="I_R_CUSTOMERFrom"></div>';
        htmlContent += '  <div class="sspcontrol-Range">';
        htmlContent += '      <select name="I_R_CUSTOMER-compare">';
        htmlContent += '        <option value="BT">Between</option>';
        htmlContent += '        <option value="EQ">Equal</option>';
        htmlContent += '        <option value="GE">Greater or Equal</option>';
        htmlContent += '        <option value="LE">Less or Equal</option>';
        htmlContent += '        <option value="GT">Greater</option>';
        htmlContent += '        <option value="LT">Less</option>';
        htmlContent += '        <option value="NE">Not Equal</option>';
        htmlContent += '        <option value="NB">Not Between</option>';
        htmlContent += '      </select>';
        htmlContent += '  </div>';
        htmlContent += '</div>';
        htmlContent += "</li>";

        htmlContent += "<li>";
        htmlContent += '<div class="sspcontrol" type="Range" style="display:flex; align-items:center; flex-wrap: wrap">';
        htmlContent += '  <div class="sspcontrol-Range"><label for="I_R_DOC_DATE-low" class="sspcontrol-desc">Document date</label></div>';
        htmlContent += '  <div class="sspcontrol-Range"><input id="I_R_DOC_DATE-low" name="I_R_DOC_DATE-From" class="k-textbox"></div>';
        htmlContent += '  <div class="sspcontrol-Range"><label for="I_R_DOC_DATE-high">to </label></div>';
        htmlContent += '  <div class="sspcontrol-Range"><input id="I_R_DOC_DATE-high" name="I_R_DOC_DATE-To" class="k-textbox" maxlength="10" data-comparevalid-field1="I_R_DOC_DATE-compare" data-comparevalid-field2="I_R_DOC_DATEFrom"></div>';
        htmlContent += '  <div class="sspcontrol-Range">';
        htmlContent += '      <select name="I_R_DOC_DATE-compare">';
        htmlContent += '        <option value="BT">Between</option>';
        htmlContent += '        <option value="EQ">Equal</option>';
        htmlContent += '        <option value="GE">Greater or Equal</option>';
        htmlContent += '        <option value="LE">Less or Equal</option>';
        htmlContent += '        <option value="GT">Greater</option>';
        htmlContent += '        <option value="LT">Less</option>';
        htmlContent += '        <option value="NE">Not Equal</option>';
        htmlContent += '        <option value="NB">Not Between</option>';
        htmlContent += '      </select>';
        htmlContent += '  </div>';
        htmlContent += '</div>';
        htmlContent += "</li>";

        htmlContent += "<li>";
        htmlContent += '<div class="sspcontrol" type="Range" style="display:flex; align-items:center; flex-wrap: wrap">';
        htmlContent += '  <div class="sspcontrol-Range"><label for="I_R_PREPARE_NAME-low" class="sspcontrol-desc">Prepare name</label></div>';
        htmlContent += '  <div class="sspcontrol-Range"><input id="I_R_PREPARE_NAME-low" name="I_R_PREPARE_NAME-From" class="k-textbox"></div>';
        htmlContent += '  <div class="sspcontrol-Range"><label for="I_R_PREPARE_NAME-high">to </label></div>';
        htmlContent += '  <div class="sspcontrol-Range"><input id="I_R_PREPARE_NAME-high" name="I_R_PREPARE_NAME-To" class="k-textbox" maxlength="10" data-comparevalid-field1="I_R_PREPARE_NAME-compare" data-comparevalid-field2="I_R_PREPARE_NAMEFrom"></div>';
        htmlContent += '  <div class="sspcontrol-Range">';
        htmlContent += '      <select name="I_R_PREPARE_NAME-compare">';
        htmlContent += '        <option value="BT">Between</option>';
        htmlContent += '        <option value="EQ">Equal</option>';
        htmlContent += '        <option value="GE">Greater or Equal</option>';
        htmlContent += '        <option value="LE">Less or Equal</option>';
        htmlContent += '        <option value="GT">Greater</option>';
        htmlContent += '        <option value="LT">Less</option>';
        htmlContent += '        <option value="NE">Not Equal</option>';
        htmlContent += '        <option value="NB">Not Between</option>';
        htmlContent += '      </select>';
        htmlContent += '  </div>';
        htmlContent += '</div>';
        htmlContent += "</li>";



        htmlContent += '<li>';
        htmlContent += '    <div><button class="k-button k-primary hidden" id="btnSubmitHidden">S</button></div>';
        htmlContent += '</li>';
        htmlContent += "</ul></form>";
        
        dvContent.html(htmlContent);

        InitKendoValidator();

        $("#inputForm").submit(function(event) {
            event.preventDefault();
            var validator = $("#inputForm").kendoValidator().data("kendoValidator");
            if (validator.validate()) {
                // DisableSubmit(true);
                ClearResult();
                var inputData = BuildInputSelection();
                GetPendingList(inputData);
            } else {
                alert("Oops! There is invalid data in the form.");
            }
        });
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

    function InitOthers() {
        $('#lbTitleName').empty();
        $('#lbTitleName').append("<h3>" + FuncDisplayName + "</h3>");

        $('.FavorStarBtn').click(function () {
            if ($(this).children(":last").hasClass('k-i-star-outline')) {
                $(this).children(":last").removeClass('k-i-star-outline');
                $(this).children(":last").addClass('k-i-star');
            }
            else {
                $(this).children(":last").removeClass('k-i-star');
                $(this).children(":last").addClass('k-i-star-outline');
            }

            ToggleFavorStar(FuncID);
        });

        GetFavorList(function (ret) {
            if (ret.FavorList.includes(FuncID)) {
                $('.FavorStarBtn').children(":last").removeClass('k-i-star-outline');
                $('.FavorStarBtn').children(":last").addClass('k-i-star');
            }
        });


        $('#btnSubmit').on('click', function () {
            ShowLoading(true);
            $("#btnSubmitHidden").click();
        });

        $('#btnRelease').on('click', function () {
            ShowLoading(true);
            selectedRst.IsCancel = false;
            Approve();
        });

        $('#btnCancelRelease').on('click', function () {
            ShowLoading(true);
            selectedRst.IsCancel = true;
            Approve();
        });

        $('#btnPrint').on('click', function () {
            ShowPODetails();
        });

        InitKendoPDFViewer();
    }


    function BuildInputSelection() {
        const controls = $('#dvNewCallContent').find('.sspcontrol');

        let inputData = {};
        inputData.Selection = [];
        inputData.I_USERNAME = "";
        
        controls.each(function(){
            let type = $(this).attr('type');
            
            if(type == 'Range') {
                let sel = {};
                sel.SelName = $($(this).find('input')[0]).attr('id').split('-')[0];
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
                            
                            inputData.Selection.push(item);
                    }
                }
                else {
                    if(sel.Low.includes("*") || sel.High.includes("*"))
                        sel.SelOption = "CP";
                    else if(sel.High.length <= 0 && (sel.SelOption == "BT" || sel.SelOption == "NT"))
                        sel.SelOption = "EQ";

                    if(sel.Low.length > 0 || sel.High.length > 0)
                        inputData.Selection.push(sel);
                }
            }
            else if( type == 'CheckBox' ){
                let name = $($(this).find('input')).attr('id');
                inputData[name] = $($(this).find('input')).is(":checked") ? 'X' : '';
            }
        });

        return JSON.stringify(inputData);

    }

    function ClearResult() {
        let dvContent = $('#dvOrderHeader');
        dvContent.empty();

        if (resultgrid != null) {
            resultgrid.data("kendoGrid").destroy();
            resultgrid.empty();
            resultgrid = null;
        }
    }

    function GetListResultProcess(result_data) {

        selectedRst = {};
        selectedRst.POReleased = [];

        CheckButtonEnable();

        InitResultGrid(result_data);
        ShowLoading(false);
    }


    function InitResultGrid(result_data) {
        if (resultgrid != null) {
            resultgrid.data("kendoGrid").destroy();
            resultgrid.empty();
        }

        resultgridDataSource = new kendo.data.DataSource({
            data: {
                "items": result_data
            },
            schema: {
                model: {
                    id: "PO",
                    fields: GetResultGridSchema()
                },
                data: "items"
            },
        });

        resultgrid = $("#gridWA").kendoGrid({
            autoBind: false,
            height: 140 + result_data.length * 35,
            dataSource: resultgridDataSource,
            sortable: true,
            reorderable: true,
            groupable: false,
            resizable: true,
            filterable: false,
            columnMenu: false,
            change: DisplayGridonSelect,
            persistSelection: true,
            pageable: false,
            scrollable: true,
            mobile: true,
            dataBound: function() {
                for (var i = 0; i < this.columns.length; i++) {
                  this.autoFitColumn(i);
                }
              },
            columns: GetResultGridColumns()
        });

        resultgridDataSource.read();
    }

    function GetResultGridSchema()
    {
        let schema = null;

        schema = {
            PO: { type: "string" },
            PO_ITEM: { type: "string" },
            PO_TYPE: { type: "string" },
            VENDOR: { type: "string" },
            VENDOR_DESRC: { type: "string" },
            PO_GROUP: { type: "string" },
            PO_DOC_DATE: { type: "string" },
            PLANT: { type: "string" },
            PREPARE_NAME: { type: "string" },
            MATERIAL: { type: "string" },
            SHORT_TEXT: { type: "string" },
            SO: { type: "string" },
            CUSTOMER_DESRC: { type: "string" },
            QTY: { type: "number" },
            ORDER_UNIT: { type: "string" },
            NET_PRICE: { type: "number" },
            PRICE_UNIT: { type: "string" },
            CURRENCY: { type: "string" },
            MAT_GROUP: { type: "string" }
        };

        return schema;
    }

    function GetResultGridColumns()
    {
        let schema = null;

        schema = [
            { selectable: true, width: "44px" },
            { field: "PO", title: "PO"}, 
            { field: "PO_ITEM ", title: "Item"}, 
            { field: "PO_TYPE", title: "Doc"}, 
            { field: "VENDOR", title: "Vendor"}, 
            { field: "VENDOR_DESRC", title: "Vendor Name"}, 
            { field: "PO_GROUP", title: "PGp"}, 
            { field: "PO_DOC_DATE", title: "PO Date"}, 
            { field: "PLANT", title: "Plant"}, 
            { field: "PREPARE_NAME", title: "Prepare Name"}, 
            { field: "MATERIAL", title: "Material"}, 
            { field: "SHORT_TEXT", title: "Short Text"}, 
            { field: "SO", title: "SO"}, 
            { field: "CUSTOMER_DESRC", title: "Customer"}, 
            { field: "QTY", title: "Qty"}, 
            { field: "ORDER_UNIT", title: "OUnit"}, 
            { field: "NET_PRICE", title: "Net Price"}, 
            { field: "PRICE_UNIT", title: "Per PUnit"}, 
            { field: "CURRENCY", title: "Currency"}, 
            { field: "MAT_GROUP", title: "Mat Grp"}
        ];

        return schema;
    }


    function DisplayGridonSelect(e) {

        selectedRst.POReleased = [];
        const rows = e.sender.select();
        rows.each(function(e) {

            let dataItem = resultgrid.data("kendoGrid").dataItem(this);
            let p = {};
            p.PONo = dataItem.PO;
            selectedRst.POReleased.push(p);

            //console.log(dataItem);
        });

        CheckButtonEnable();
    }

    function CheckButtonEnable()
    {
        if (selectedRst.POReleased.length < 1) {
            $('#btnRelease').attr('disabled', 'disabled');
            $('#btnCancelRelease').attr('disabled', 'disabled');
        } else {
            $('#btnRelease').removeAttr('disabled');
            $('#btnCancelRelease').removeAttr('disabled');
        }

        if (selectedRst.POReleased.length == 1) {
            $('#btnPrint').removeAttr('disabled');
        } else {
            $('#btnPrint').attr('disabled', 'disabled');
        }
    }

    function ShowPODetails() 
    {
        ShowLoading(true);
        var pono = selectedRst.POReleased[0].PONo;
        GetDetail(pono);
    }

    function ShowApproveResult(rst) {
        let contentHtml = '' +
                            '<span style="display: inline-block; min-width: 180px"><strong>Result</strong></span>' +
                            '<br><br>';
        for (var i = 0; i < rst.length; i++) {
            contentHtml += '' +
                            '<span style="display: inline-block; min-width: 180px">' + (rst[i].MESSAGE.length > 1 ? rst[i].MESSAGE : "OK") + '</span>' +
                            '<br>';
        }

        if (kdApproveDialog == null) {
            kdApproveDialog = $("#kdApproveRet").kendoDialog({
                width: "400px",
                buttonLayout: "normal",
                title: "Approve Result",
                closable: true,
                modal: true,
                content: contentHtml,
                actions: [
                    { text: 'OK', primary: true }
                ]
            });
        } else {
            kdApproveDialog.data("kendoDialog").content(contentHtml);
            kdApproveDialog.data("kendoDialog").open();
        }

        if(resultgrid != null) {
            ShowLoading(true);
            GetPendingList(BuildInputSelection());
        }
    }

    function InitActingApprover(result) {
        if (result == null || result.length <= 0)
            return;

        $("#dvApproverActing").show();

        let optionHtml = "";
        for (var i = 0; i < result.length; i++) {
            optionHtml += '<option value="' + result[i] + '">' + result[i] + '</option>';
        }
        $("#opApproverActing").html(optionHtml);

        $("#ckbApproverActing").change(function () {
            if (this.checked) {
                $("#opApproverActing").removeAttr('disabled');
                ActingApprover = $("#opApproverActing").children("option:selected").val();
                if(resultgrid != null) {
                    ShowLoading(true);
                    GetPendingList(BuildInputSelection());
                }
            } else {
                {
                    $("#opApproverActing").attr('disabled', 'disabled');
                    ActingApprover = "";
                    if(resultgrid != null) {
                        ShowLoading(true);
                        GetPendingList(BuildInputSelection());
                    }
                }
            }
        });

        $("#opApproverActing").change(function () {
            ActingApprover = $(this).children("option:selected").val();

            if(resultgrid != null) {
                ShowLoading(true);
                GetPendingList(BuildInputSelection());
            }
        });
    }

    function InitKendoPDFViewer() 
    {
        kwPDFViewer = $("#kwPDFViewer").kendoWindow(
        {
            width: "1347px",
            height: "747px",
            title: "PO Detail",
            actions: ["Maximize", "Close"],
            resizable: true,
            modal: true,
            refresh: PDFViewerWindowOnRefresh,
            visible: false,
            position: {
                top: 10, // or "100px"
                left: 10
              }
        });
    }

    function PDFViewerWindowOpen(sid) 
    {    
        if (kwPDFViewer != null) 
        {
            selectedDetailSID = sid;

            kwPDFViewer.data("kendoWindow").refresh({
                url: "pdfviewer.html",
                type: "GET",
                data: { sid: sid }
            });

            kwPDFViewer.data("kendoWindow").open();
        }
    }

    function PDFViewerWindowOnRefresh()
    {
        $('#pdfViewer').empty();
        var content = '<embed src="' + "GetPOPrintPreview.ashx?sid=" + selectedDetailSID + '" type="application/pdf" width="1300px" height="740px"/>';
        $('#pdfViewer').append(content);
    }


    function GetFavorList(callback) {
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

    function ToggleFavorStar(functionID) {
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

    function GetDetail(pono) 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "PO.ashx",
            data: {
                Action: "printpreview",
                Token: AccessToken,
                User: UserName,
                FuncID: FuncID,
                PONo: pono,
                Guid: "xxguidxx"
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText + ";" + error);
                alert(request.statusText + ";" + error);
            },
            success: function (data) {
                //console.log(data);
                PDFViewerWindowOpen(data);
            },
            complete: function () {
                ShowLoading(false);
            }
        });
    }

    function GetPendingList(inputData) {
        $.ajax({
            type: "POST",
            async: true,
            url: "PO.ashx",
            data: {
                Action: "list",
                Token: AccessToken,
                User: UserName,
                FuncID: FuncID,
                Approver: ActingApprover,
                Data: inputData
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText + ";" + error);
                alert(request.statusText);
                ShowLoading(false);
            },
            success: function (data) {
                GetListResultProcess(data);
            }
        });
    }

    function GetActingApprover() {
        $.ajax({
            type: "POST",
            async: true,
            url: "PO.ashx",
            data: {
                Action: "getaappr",
                Token: AccessToken,
                User: UserName,
                FuncID: FuncID,
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText + ";" + error);
                alert(request.statusText);
                ShowLoading(false);
            },
            success: function (data) {
                InitActingApprover(data);
                ShowLoading(false);
            }
        });
    }

    function Approve() {
        $.ajax({
            type: "POST",
            async: true,
            url: "PO.ashx",
            data: {
                Action: "approve",
                Token: AccessToken,
                User: UserName,
                FuncID: FuncID,
                Data: JSON.stringify(selectedRst),
                Approver: ActingApprover
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText + ";" + error);
                alert(request.statusText);
                ShowLoading(false);
            },
            success: function (data) {
                //console.log(data);
                ShowApproveResult(data);
            }
        });
    }


}
