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
        htmlContent += '<div class="sspcontrol" type="ComboBox" style="display:flex; align-items:center; flex-wrap: wrap" >';
        htmlContent += '  <div class="sspcontrol-Range"><label for="Type" class="sspcontrol-desc">Claim Type<label class="sspcontrol-req">*</label>:</label></div>';
        htmlContent += '  <div class="sspcontrol-Range"><input id="Type" name="Type" type="comboS" mstsrc="Mst_ClaimType" maxlength="10" required></div>';
        htmlContent += '</div>'; 
        htmlContent += "</li>";

        htmlContent += "<li>";
        htmlContent += '<div class="sspcontrol" type="Text" style="display:flex; align-items:center; flex-wrap: wrap" >';
        htmlContent += '  <div class="sspcontrol-Text"><label for="Doc" class="sspcontrol-desc">Claim No.<label class="sspcontrol-req">*</label>:</label></div>';
        htmlContent += '  <div class="sspcontrol-Text"><input id="Doc" name="Doc" class="k-textbox" style="width:14ch" value="" maxlength="10" required></div>';
        htmlContent += '</div>'; 
        htmlContent += "</li>";


        htmlContent += '<li>';
        htmlContent += '    <div><button class="k-button k-primary hidden" id="btnSubmitHidden">S</button></div>';
        htmlContent += '</li>';
        htmlContent += "</ul></form>";
        
        dvContent.html(htmlContent);

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
                dataSource: GetMasterDataSource(mstSource),
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
                dataBound: function (e) {
                    var listContainer = e.sender.list.closest(".k-list-container");
                    listContainer.width(400 + kendo.support.scrollbar());
                },                    
                autoWidth: true,
                height: 400,
                animation: false
            });
        });  
        
        InitKendoValidator();

        $("#inputForm").submit(function(event) {
            event.preventDefault();
            var validator = $("#inputForm").kendoValidator().data("kendoValidator");
            if (validator.validate()) {
                // DisableSubmit(true);
                $('#btnApprove').attr('disabled', 'disabled');
                ClearResult();
                var inputData = BuildInputSelection();
                GetPendingList(inputData);
            } else {
                alert("Oops! There is invalid data in the form.");
            }
        });
    }

    function GetMasterDataSource(mstName)
    {
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

        return source;
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

        $('#btnApprove').on('click', function () {
            ShowLoading(true);
            Approve();
        });
    }


    function BuildInputSelection() {
        const controls = $('#dvNewCallContent').find('.sspcontrol');

        let inputData = {};
        inputData.Selection = [];
        
        selectedRst = {};

        controls.each(function(){
            let type = $(this).attr('type');
            
            if( type == 'Text' ) {
                let sel = {};
                sel.Name = $($(this).find('input')).attr('id');
                sel.Value = $($(this).find('input')).val();

                inputData.Selection.push(sel);

                selectedRst.Doc = sel.Value;
            }
            else if(type == 'ComboBox') {
                let sel = {};
                sel.Name = $($(this).find('input')[1]).attr('id');
                sel.Value = $($(this).find('input')[1]).data("kendoComboBox").value();

                inputData.Selection.push(sel);

                selectedRst.Type = sel.Value;
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

        InitResultDvHeader(result_data[0]);
        InitResultGrid(result_data[1]);
        $('#btnApprove').removeAttr('disabled');
        ShowLoading(false);
    }

    function InitResultDvHeader(result_data) {
        let dvContent = $('#dvOrderHeader');
        let htmlContent = "";
        let hdr = result_data[0];

        let mapping = [];
        if(selectedRst.Type == "AR") {

            mapping = [
                { type: "label", field: "DOCNO", title: "Application No."}, 
                { type: "spaceholder"},
                { type: "label", field: "BUKRS", title: "Company Code"}, 
                { type: "spaceholder"},
                { type: "label", field: "ARDAT", title: "Exp. Air Date"}, 
                { type: "label", field: "WAERS", title: "Currency"}, 
                { type: "spaceholder"},
                { type: "label", field: "ESTCOST", title: "Est. Cost", format: "money"}, 
                { type: "spaceholder"},
                { type: "label-2", field: "ESTQTY", field2: "EMEIN", title: "Est. Total Qty", format: "integer" }, 
                { type: "spaceholder"},
                { type: "label", field: "PORTION", title: "Air Method"}, 
                { type: "JCostSp"},
                { type: "spaceholder"},
                { type: "spaceholder"},
            ];
        }
        else if(selectedRst.Type == "AC") {

            mapping = [
                { type: "label", field: "DOCNO", title: "Inward Claim"}, 
                { type: "spaceholder"},
                { type: "label", field: "REFN2", title: "Outward Claim"}, 
                { type: "spaceholder"},
                { type: "label", field: "BUKRS", title: "Company Code"}, 
                { type: "spaceholder"},
                { type: "spaceholder"},
                { type: "label", field: "ZLSCH", title: "Payment method"}, 
                { type: "label", field: "CSDAT", title: "Claim Case Date"}, 
                { type: "label", field: "ERDAT", title: "Created On"}, 
                { type: "spaceholder"},
                { type: "label", field: "WAERS", title: "Currency"}, 
                { type: "label", field: "ARDAT", title: "Exp. Air Date"}, 
                { type: "label", field: "ERNAM", title: "Created By"}, 
                { type: "spaceholder"},
                { type: "label", field: "ESTCOST", title: "Total Claim Amt", format: "money"}, 
                { type: "label", field: "PORTION", title: "Claim Portion"}, 
                { type: "label", field: "FOLLW", title: "Follow By"}, 
                { type: "spaceholder"},
                { type: "label-2", field: "ESTQTY", field2: "EMEIN", title: "Est. Total Qty", format: "integer"},  
                { type: "label", field: "PORTION", title: "Air Bill Mark"}, 
                { type: "spaceholder"},
                { type: "label", field: "PRVAMT", title: "Provision Amt", format: "money"}, 
                { type: "spaceholder"},
            ];
        }
        else if(selectedRst.Type == "IN") {

            mapping = [
                { type: "label", field: "DOCNO", title: "Inward Claim"}, 
                { type: "spaceholder"},
                { type: "label", field: "REFN2", title: "Outward Claim"}, 
                { type: "spaceholder"},
                { type: "label", field: "BUKRS", title: "Company Code"}, 
                { type: "spaceholder"},
                { type: "spaceholder"},
                { type: "label", field: "ZLSCH", title: "Payment method"}, 
                { type: "label", field: "CSDAT", title: "Claim Case Date"}, 
                { type: "label", field: "ERDAT", title: "Created On"}, 
                { type: "spaceholder"},
                { type: "label", field: "WAERS", title: "Currency"}, 
                { type: "label", field: "ERNAM", title: "Created By"}, 
                { type: "spaceholder"},
                { type: "label", field: "ESTCOST", title: "Est. Cost", format: "money"}, 
                { type: "label", field: "FOLLW", title: "Follow By"}, 
                { type: "spaceholder"},
                { type: "label", field: "PRVAMT", title: "Provision Amt", format: "money"}, 
                { type: "spaceholder"},
            ];
        }
        else if(selectedRst.Type == "OU") {

            mapping = [
                { type: "label", field: "DOCNO", title: "Inward Claim"}, 
                { type: "spaceholder"},
                { type: "label", field: "REFN2", title: "Outward Claim"}, 
                { type: "spaceholder"},
                { type: "label", field: "BUKRS", title: "Company Code"}, 
                { type: "spaceholder"},
                { type: "spaceholder"},
                { type: "label", field: "ZLSCH", title: "Payment method"}, 
                { type: "label", field: "CSDAT", title: "Claim Case Date"}, 
                { type: "label", field: "ERDAT", title: "Created On"}, 
                { type: "spaceholder"},
                { type: "label", field: "WAERS", title: "Currency"}, 
                { type: "label", field: "ERNAM", title: "Created By"}, 
                { type: "label", field: "ATTN", title: "Attend to"}, 
                { type: "spaceholder"},
                { type: "label", field: "ESTCOST", title: "Total Claim Amt", format: "money"}, 
                { type: "label", field: "FOLLW", title: "Follow By"}, 
                { type: "spaceholder"},
                { type: "label", field: "CREDI", title: "Debtor"}, 
                { type: "spaceholder"},
            ];
        }

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
            else if(item.type == "JCostSp") {              
                var margintop = $('#dvWAPanel').width() > 750 ? "-5em" : "0em";  
                htmlContent += '<div style="display: flex; margin-top: '+margintop+'">';
                htmlContent += '    <div class="FixLabel" style="width:250px; height:calc(1.6em + 50px)">';
                htmlContent += '    <input type="radio" id="rdPrePaid" name="rdJCost" value="Pre-Paid" readonly '+(hdr['JCOST'].includes('Pre-Paid')? "checked" : "disabled")+'>';
                htmlContent += '    <label for="rdPrePaid">Pre-Paid - Garment C&F</label><br>';
                htmlContent += '    <input type="radio" id="rdCollect" name="rdJCost" value="Collect" readonly '+(hdr['JCOST'].includes('Collect')? "checked" : "disabled")+'>';
                htmlContent += '    <label for="rdCollect">Collect</label><br>';
                htmlContent += '    <input type="radio" id="rdFty" name="rdJCost" value="Fty" readonly '+(hdr['JCOST'].includes('Fty')? "checked" : "disabled")+'>';
                htmlContent += '    <label for="rdFty">Fty Responsible</label>';
                htmlContent += '    </div>';
                htmlContent += '</div>';    
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
                    id: "DOCNO",
                    fields: {
                        DOCNO: { type: "string" },
                        POSNR: { type: "string" },
                        VBELN: { type: "string" },
                        AUPOS: { type: "string" },
                        J_3ASIZE: { type: "string" },
                        MTART: { type: "string" },
                        VKGRP: { type: "string" },
                        ZZCO: { type: "string" },
                        BSTNK: { type: "string" },
                        CPARTY: { type: "string" },
                        RPARTY: { type: "string" },
                        SUBJT: { type: "string" },
                        CAUSE: { type: "string" },
                        COMPN: { type: "string" },
                        ESTCOST: { type: "string" },
                        ESTQTY: { type: "string" },
                        EBETR: { type: "string" },
                        EPEIN: { type: "string" },
                        XBLNR: { type: "string" },
                        STATUS: { type: "string" }
                    }
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
            pageable: false,
            scrollable: true,
            dataBound: function() {
                for (var i = 0; i < this.columns.length; i++) {
                  this.autoFitColumn(i);
                }
              },
            columns: [
                    { field: "DOCNO", title: "Document No."}, 
                    { field: "POSNR", title: "Item No."}, 
                    { field: "VBELN", title: "SD Document No"}, 
                    { field: "AUPOS", title: "Item No. of SD document"}, 
                    { field: "J_3ASIZE", title: "Grid Value"}, 
                    { field: "MTART", title: "Material Type"}, 
                    { field: "VKGRP", title: "Sales Group"}, 
                    { field: "ZZCO", title: "CO / Prod Line / Base"}, 
                    { field: "BSTNK", title: "Customer PO No."}, 
                    { field: "CPARTY", title: "Claim Party"}, 
                    { field: "RPARTY", title: "Responsible Party"}, 
                    { field: "SUBJT", title: "Claim Subject"}, 
                    { field: "CAUSE", title: "Claim Cause"}, 
                    { field: "COMPN", title: "Claim Compensation"}, 
                    { field: "ESTCOST", title: "Estimated Cost"}, 
                    { field: "ESTQTY", title: "Estimated quantity"}, 
                    { field: "EBETR", title: "Estimated Rate"}, 
                    { field: "EPEIN", title: "Price Unit"}, 
                    { field: "XBLNR", title: "Reference Document No."}, 
                    { field: "STATUS", title: "Status"}
            ]
        });

        resultgridDataSource.read();
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

    function GetPendingList(inputData) {
        $.ajax({
            type: "POST",
            async: true,
            url: "Claim.ashx",
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
            url: "Claim.ashx",
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
            url: "Claim.ashx",
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
