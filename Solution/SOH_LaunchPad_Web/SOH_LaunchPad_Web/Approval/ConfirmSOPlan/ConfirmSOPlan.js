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
        htmlContent += '<div class="sspcontrol" type="Range" style="display:flex; align-items:center; flex-wrap: wrap">';
        htmlContent += '  <div class="sspcontrol-Range"><label for="VBELN-low" class="sspcontrol-desc">Sales Order Number</label></div>';
        htmlContent += '  <div class="sspcontrol-Range"><input id="VBELN-low" name="VBELN-From" class="k-textbox" required></div>';
        htmlContent += '  <div class="sspcontrol-Range"><label for="VBELN-high">to </label></div>';
        htmlContent += '  <div class="sspcontrol-Range"><input id="VBELN-high" name="VBELN-To" class="k-textbox" maxlength="10" data-comparevalid-field1="VBELN-compare" data-comparevalid-field2="VBELN-From"></div>';
        htmlContent += '  <div class="sspcontrol-Range">';
        htmlContent += '      <select name="VBELN-compare">';
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

        var selectControls = dvContent.find("select");
        selectControls.each(function(){
            $(this).kendoDropDownList();
        });

        InitKendoValidator();

        $("#inputForm").submit(function(event) {
            event.preventDefault();
            var validator = $("#inputForm").kendoValidator().data("kendoValidator");
            if (validator.validate()) {
                // DisableSubmit(true);
                ClearResult();
                ShowLoading(true);
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
        
        controls.each(function(){
            let type = $(this).attr('type');
            
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
        selectedRst.SOReleased = [];

        $('#btnApprove').attr('disabled', 'disabled');

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
                    id: "VBELN",
                    fields: GetResultGridSchema()
                },
                data: "items"
            },
            filter: { field: "DATA_TYPE", operator: "eq", value: "SO" }
        });

        resultgrid = $("#gridWA").kendoGrid({
            autoBind: false,
            height: 140 + result_data.length * 80,
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
            detailInit: function(e) {
                $("<div/>").appendTo(e.detailCell).kendoGrid({
                    dataSource: GetResultDetailDS(result_data, e.data.VBELN),
                    scrollable: true,
                    sortable: true,
                    pageable: false,
                    resizable: true,
                    // dataBound: function() {
                    //     for (var i = 0; i < this.columns.length; i++) {
                    //       this.autoFitColumn(i);
                    //     }
                    // },
                    columns: GetResultGridColumnsDetail()
                });
            },
            dataBound: function() {
                for (var i = 0; i < this.columns.length; i++) {
                  this.autoFitColumn(i);
                }
                this.expandRow(this.tbody.find("tr.k-master-row").first());
            },
            columns: GetResultGridColumnsHeader()
        });

        resultgridDataSource.read();
    }

    function GetResultDetailDS(data, so) 
    {
        let resultgridDataSource_detail = new kendo.data.DataSource({
            data: {
                "items": data
            },
            schema: {
                model: {
                    id: "VBELN",
                    fields: GetResultGridSchema()
                },
                data: "items"
            },
            filter: { field: "VBELN", operator: "eq", value: so }
        });

        return resultgridDataSource_detail;
    }

    function GetResultGridSchema()
    {
        let schema = null;

        if(true) {
            schema = {
                VBELN: { type: "string" },
                CUSTOMER: { type: "string" },
                NAME1: { type: "string" },
                ZZFSN: { type: "string" },
                KNUMV: { type: "string" },
                KUNNR: { type: "string" },
                WAERK: { type: "string" },
                ERDAT: { type: "string" },
                CUR: { type: "string" },
                DATA_TYPE: { type: "string" },
                QTY: { type: "number" },
                TTL_RM1: { type: "number" },
                TTL_RM2: { type: "number" },
                CEN_TRI: { type: "number" },
                CEN_FTY: { type: "number" },
                INW_HAND: { type: "number" },
                OUT_HAND: { type: "number" },
                SAM1_DZ: { type: "number" },
                SAM2_DZ: { type: "number" },
                SAM3_DZ: { type: "number" },
                HAN_STI_SAM: { type: "number" },
                KNI_TRI_SAM: { type: "number" },
                FIN_SAM: { type: "number" },
                FIN_OTH_SAM: { type: "number" },
                KNI_SAM_COST: { type: "number" },
                SUB_LIN_COST: { type: "number" },
                SUB_FIN_COST: { type: "number" },
                KNI_TRI_COST: { type: "number" },
                LIN_SAM_COST: { type: "number" },
                SEW_SAM_COST: { type: "number" },
                HS_SAM_COST: { type: "number" },
                FIN_SAM_COST: { type: "number" },
                FIN_OTH_COST: { type: "number" },
                FTY_SUB: { type: "number" },
                TTL_CM_COST: { type: "number" },
                PRINT_COST: { type: "number" },
                EM_COST: { type: "number" },
                SP_PRO_COST: { type: "number" },
                SP_PRO_TRD: { type: "number" },
                FTY_PURTRIM: { type: "number" },
                FS_MARKUP: { type: "number" },
                WASH_COST: { type: "number" },
                WAT_TRE: { type: "number" },
                MISC_COST: { type: "number" },
                FTY_TAX: { type: "number" },
                COST_SALES: { type: "number" },
                GRO_SALES: { type: "number" },
                GP: { type: "number" },
                NET_SALES: { type: "number" },
                GP_: { type: "number" },
                TAR_PRICE: { type: "number" },
                COM_INT_EXC: { type: "number" },
                COM_EXT_INC: { type: "number" },
                PAY_DISC: { type: "number" },
                OP_PRE: { type: "number" },
                LIA_INS: { type: "number" },
                GP_C: { type: "number" },
                NET_SALES_C: { type: "number" },
                GP__C: { type: "number" }
            };
        }
        
        return schema;
    }

    function GetResultGridColumnsHeader()
    {
        let schema = null;

        schema = [
            { selectable: true, width: "44px" },
            { field: "VBELN", title: "SO Number"},
            { field: "CUSTOMER", title: "Customer"},
            { field: "NAME1", title: "Brand"},
            { field: "ZZFSN", title: "Factory Style No."},
            { field: "CUR", title: "Currency"}
        ];
        
        return schema;
    }

    function GetResultGridColumnsDetail()
    {
        let schema = null;

        schema = [
            { field: "DATA_TYPE", title: "Type", width: "80px"},
            { field: "QTY", title: "Qty", width: "100px"},
            { field: "TTL_RM1", title: "Total Yarn Cost 1", width: "110px"},
            { field: "TTL_RM2", title: "Total Yarn Cost 2", width: "110px"},
            { field: "CEN_TRI", title: "Central Pur. Trim TRA", width: "100px"},
            { field: "CEN_FTY", title: "Central Pur. Trim FTY", width: "100px"},
            { field: "INW_HAND", title: "Inward\nHandling", width: "100px"},
            { field: "OUT_HAND", title: "Outward\nHandling", width: "100px"},
            { field: "SAM1_DZ", title: "SAM1 - Knitting/DZ", width: "100px"},
            { field: "SAM2_DZ", title: "SAM2 - Linkage/DZ", width: "100px"},
            { field: "SAM3_DZ", title: "SAM3 - Sewing/DZ", width: "100px"},
            { field: "KNI_SAM_COST", title: "Knitting SAM \nCost", width: "100px"},
            { field: "LIN_SAM_COST", title: "Linking SAM \nCost", width: "100px"},
            { field: "SEW_SAM_COST", title: "Sewing SAM \nCost", width: "100px"},
            { field: "TTL_CM_COST", title: "Total C&M \nCost", width: "100px"},
            { field: "PRINT_COST", title: "Printing \nCost", width: "100px"},
            { field: "EM_COST", title: "Embroidery \nCost", width: "100px"},
            { field: "SP_PRO_COST", title: "Special Process \nCost", width: "100px"},
            { field: "SP_PRO_TRD", title: "Sp Process \n(Trading)", width: "100px"},
            { field: "FTY_PURTRIM", title: "Factory \nPurchase Trim", width: "100px"},
            { field: "FS_MARKUP", title: "FS Markup", width: "100px"},
            { field: "WASH_COST", title: "Washing Cost", width: "100px"},
            { field: "WAT_TRE", title: "Water \nTreatment", width: "100px"},
            { field: "MISC_COST", title: "Misc. Cost", width: "100px"},
            { field: "FTY_TAX", title: "Factory Tax & \nOthers", width: "100px"},
            { field: "COST_SALES", title: "Cost of Sales", width: "100px"},
            { field: "GRO_SALES", title: "Gross Sales", width: "100px"},
            { field: "GP", title: "GP (DOZ)", width: "100px"},
            { field: "NET_SALES", title: "Net Sales", width: "100px"},
            { field: "GP_", title: "GP%", width: "100px"},
            { field: "TAR_PRICE", title: "Target Price", width: "100px"},
            { field: "COM_INT_EXC", title: "Comm Internal \nExclus", width: "100px"},
            { field: "COM_EXT_INC", title: "Comm External \nInclus", width: "100px"},
            { field: "PAY_DISC", title: "Payment \nDiscount", width: "100px"},
            { field: "OP_PRE", title: "Option \nPremium", width: "100px"},
            { field: "LIA_INS", title: "Lia. Insurance", width: "100px"},
            { field: "GP_C", title: "GP", width: "100px"},
            { field: "NET_SALES_C", title: "Net Sales", width: "100px"},
            { field: "GP__C", title: "GP%", width: "80px"}
        ];
    
        return schema;
    }


    function DisplayGridonSelect(e) {

        selectedRst.SOReleased = [];
        const rows = e.sender.select();
        rows.each(function(e) {

            let dataItem = resultgrid.data("kendoGrid").dataItem(this);
            selectedRst.SOReleased.push(dataItem.VBELN);

            //console.log(dataItem);
        });

        if (selectedRst.SOReleased.length < 1) {
            $('#btnApprove').attr('disabled', 'disabled');
        } else {
            $('#btnApprove').removeAttr('disabled');
        }
    }

    function ShowApproveResult(rst) {
        let contentHtml = '<span style="display: inline-block; min-width: 120px"><strong>SO</strong></span>' +
                            '<span style="display: inline-block; min-width: 180px"><strong>Result</strong></span>' +
                            '<br><br>';
        for (var i = 0; i < rst.length; i++) {
            contentHtml += '<span style="display: inline-block; min-width: 120px">' + rst[i].OBJECTID + '</span>' +
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
            url: "ConfirmSOPlan.ashx",
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
            url: "ConfirmSOPlan.ashx",
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
            url: "ConfirmSOPlan.ashx",
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
