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

    var resultgridHeaderDataSource = null;
    var resultgridHeader = null;

    var selectedRst = null;

    var kdApproveDialog = null;

    $(document).ready(Begin);

    function Begin() {
        LoadThemeSetting();

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
        htmlContent += '<div class="sspcontrol" type="Text" style="display:flex; align-items:center; flex-wrap: wrap" >';
        htmlContent += '  <div class="sspcontrol-Text"><label for="Vendor" class="sspcontrol-desc">Vendor<label class="sspcontrol-req">*</label>:</label></div>';
        htmlContent += '  <div class="sspcontrol-Text"><input id="Vendor" name="Vendor" class="k-textbox" style="width:14ch" value="" maxlength="10" required></div>';
        htmlContent += '</div>'; 
        htmlContent += "</li>";

        htmlContent += "<li>";
        htmlContent += '<div class="sspcontrol" type="Text" style="display:flex; align-items:center; flex-wrap: wrap" >';
        htmlContent += '  <div class="sspcontrol-Text"><label for="SONo" class="sspcontrol-desc">Sales Document<label class="sspcontrol-req">*</label>:</label></div>';
        htmlContent += '  <div class="sspcontrol-Text"><input id="SONo" name="SONo" class="k-textbox" style="width:14ch" value="" maxlength="10" required></div>';
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

        var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
        var eventer = window[eventMethod];
        var messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";
        eventer(messageEvent, function (e) {

            if (e.data.startsWith("[UpdateTheme]"))
                LoadThemeSetting();

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

    function LoadThemeSetting() {
        let t = localStorage.getItem('SOH_MainTheme');
        if (t == null) return;
        UpdateThemeCSS(t);
    }

    function UpdateThemeCSS(newTheme) {
        let targetelement = "link";
        let targetattr = "tag";
        let targetattrval = "themecss";
        let allsuspects = document.getElementsByTagName(targetelement);
        for (var i = allsuspects.length; i >= 0; i--) {
            if (allsuspects[i] && allsuspects[i].getAttribute(targetattr) != null && allsuspects[i].getAttribute(targetattr) == targetattrval) {
                let newelement = document.createElement("link");
                newelement.setAttribute("rel", "stylesheet");
                newelement.setAttribute("type", "text/css");
                newelement.setAttribute("href", "../../styles/kgrid_" + newTheme + ".css");
                newelement.setAttribute(targetattr, targetattrval);
                allsuspects[i].parentNode.replaceChild(newelement, allsuspects[i]);
            }
        }
    }

    function BuildInputSelection() {
        const controls = $('#dvNewCallContent').find('.sspcontrol');

        let inputData = new Object();
        inputData.Selection = [];
        
        controls.each(function(){
            let type = $(this).attr('type');
            
            if( type == 'Text' ) {
                let sel = new Object();
                sel.Name = $($(this).find('input')).attr('id');
                sel.Value = $($(this).find('input')).val();

                inputData.Selection.push(sel);
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

        selectedRst = new Object();
        selectedRst.SO = result_data[0][0].SO;
        selectedRst.Vendor = result_data[0][0].VENDOR;
        selectedRst.PNReleased = [];

        InitResultGridHeader(result_data[0]);
        InitResultGrid(result_data[1]);
        ShowLoading(false);
    }

    function InitResultDvHeader(result_data) {
        let dvContent = $('#dvOrderHeader');
        let htmlContent = "";

        const keys = Object.keys(result_data[0]);
        const values = Object.values(result_data[0]);

        const mapping = [
            { field: "SO", title: "SO No."}, 
            { field: "VENDOR", title: "Vendor"}, 
            { field: "COUNTRY", title: "Country"}, 
            { field: "CURRENCY", title: "Currency"}, 
            { field: "TOTAL_COST", title: "Total Cost"}, 
            { field: "MAIN_F1_COST", title: "Main Fab/Yarn Cost"}, 
            { field: "TRIM_F1_COST", title: "Trim Fab/Yarn Cost"}, 
            { field: "CENTRALPUR_TRIM_COST", title: "CentralPur Trim Cost"}, 
            { field: "FTY_PUR_TRIM_COST", title: "Fty Pur Trim Cost"}, 
            { field: "C_M_COST", title: "C&M Cost"}, 
            { field: "WASHING_COST", title: "Washing Cost"}, 
            { field: "WATER_TREATMENT_COST", title: "Water Treatment Cost"}, 
            { field: "SP_PROCESS_COST", title: "Sp. Process Cost"}, 
            { field: "FTY_TAX_AND_OTHERS", title: "Fty Tax and Others"}, 
            { field: "LA_KNIT", title: "Loc. adj. Knit-CSL"}, 
            { field: "LA_LINK", title: "Loc. adj. Link-CSL"}, 
            { field: "LA_SEW", title: "Loc. adj. Sew-CSL"}, 
            { field: "LA_FINISH", title: "Loc. adj. Finish-CSL"}, 
            { field: "FS_MARK_UP", title: "FS Mark up"}
        ];

        for(var i=0; i<keys.length; i++) {

            for(var j=0; j<mapping.length; j++){
                if(mapping[j].field == keys[i] ) {
                    htmlContent += '<div class="k-block k-info-colored" style="margin-right: 0.5em; margin-top: 0.5em">';
                    htmlContent += '<div class="k-header">'+mapping[j].title+'</div>'+values[i];
                    htmlContent += '</div>';
                }
            }
        }

        dvContent.html(htmlContent);
    }

    function InitResultGridHeader(result_data) {
        InitResultDvHeader(result_data);

        // if (resultgridHeader != null) {
        //     resultgridHeader.data("kendoGrid").destroy();
        //     resultgridHeader.empty();
        // }

        // resultgridHeaderDataSource = new kendo.data.DataSource({
        //     data: {
        //         "items": result_data
        //     },
        //     schema: {
        //         model: {
        //             id: "SO",
        //             fields: {
        //                 SO: { type: "string" },
        //                 VENDOR: { type: "string" },
        //                 COUNTRY: { type: "string" },
        //                 CURRENCY: { type: "string" },
        //                 TOTAL_COST: { type: "string" },
        //                 MAIN_F1_COST: { type: "string" },
        //                 TRIM_F1_COST: { type: "string" },
        //                 CENTRALPUR_TRIM_COST: { type: "string" },
        //                 FTY_PUR_TRIM_COST: { type: "string" },
        //                 C_M_COST: { type: "string" },
        //                 WASHING_COST: { type: "string" },
        //                 WATER_TREATMENT_COST: { type: "string" },
        //                 SP_PROCESS_COST: { type: "string" },
        //                 FTY_TAX_AND_OTHERS: { type: "string" },
        //                 LA_KNIT: { type: "string" },
        //                 LA_LINK: { type: "string" },
        //                 LA_SEW: { type: "string" },
        //                 LA_FINISH: { type: "string" },
        //                 FS_MARK_UP: { type: "string" }
        //             }
        //         },
        //         data: "items"
        //     },
        // });

        // resultgridHeader = $("#gridWAHeader").kendoGrid({
        //     autoBind: false,
        //     height: 120 + result_data.length * 35,
        //     dataSource: resultgridHeaderDataSource,
        //     sortable: true,
        //     reorderable: true,
        //     groupable: false,
        //     resizable: true,
        //     filterable: false,
        //     columnMenu: false,
        //     pageable: false,
        //     scrollable: true,
        //     dataBound: function() {
        //         for (var i = 0; i < this.columns.length; i++) {
        //           this.autoFitColumn(i);
        //         }
        //       },
        //     columns: [
        //             { field: "SO", title: "SO No."}, 
        //             { field: "VENDOR", title: "Vendor Account Number"}, 
        //             { field: "COUNTRY", title: "Country Key"}, 
        //             { field: "CURRENCY", title: "Currency Key"}, 
        //             { field: "TOTAL_COST", title: "Total Cost"}, 
        //             { field: "MAIN_F1_COST", title: "Main Fab/Yarn Cost"}, 
        //             { field: "TRIM_F1_COST", title: "Trim Fab/Yarn Cost"}, 
        //             { field: "CENTRALPUR_TRIM_COST", title: "CentralPur Trim Cost"}, 
        //             { field: "FTY_PUR_TRIM_COST", title: "Fty Pur Trim Cost"}, 
        //             { field: "C_M_COST", title: "C&M"}, 
        //             { field: "WASHING_COST", title: "Washing Cost"}, 
        //             { field: "WATER_TREATMENT_COST", title: "Water Treatment Cost"}, 
        //             { field: "SP_PROCESS_COST", title: "Sp. Process Cost"}, 
        //             { field: "FTY_TAX_AND_OTHERS", title: "Fty Tax and Others"}, 
        //             { field: "LA_KNIT", title: "Loc. adj. Knit-CSL"}, 
        //             { field: "LA_LINK", title: "Loc. adj. Link-CSL"}, 
        //             { field: "LA_SEW", title: "Loc. adj. Sew-CSL"}, 
        //             { field: "LA_FINISH", title: "Loc. adj. Finish-CSL"}, 
        //             { field: "FS_MARK_UP", title: "FS Mark up"}
        //     ]
        // });

        // resultgridHeaderDataSource.read();
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
                    id: "PN",
                    fields: {
                        PN: { type: "string" },
                        RELEASED: { type: "string" },
                        COUNTRY: { type: "string" },
                        CURRENCY: { type: "string" },
                        TOTAL_COST: { type: "string" },
                        MAIN_F1_COST: { type: "string" },
                        TRIM_F1_COST: { type: "string" },
                        CENTRALPUR_TRIM_COST: { type: "string" },
                        FTY_PUR_TRIM_COST: { type: "string" },
                        C_M_COST: { type: "string" },
                        WASHING_COST: { type: "string" },
                        WATER_TREATMENT_COST: { type: "string" },
                        SP_PROCESS_COST: { type: "string" },
                        FTY_TAX_AND_OTHERS: { type: "string" },
                        LA_KNIT: { type: "string" },
                        LA_LINK: { type: "string" },
                        LA_SEW: { type: "string" },
                        LA_FINISH: { type: "string" },
                        FS_MARK_UP: { type: "string" },
                        CSL_KNIT: { type: "string" },
                        KNIT_SAM_QTY: { type: "string" },
                        CSL_LINK_SAM_PER_QTY: { type: "string" },
                        SEW_SAM_PER_QTY: { type: "string" },
                        CSL_FINISH_AMTQTY: { type: "string" },
                        CSL_FINISH_OTH_SAM: { type: "string" },
                        KNIT_TRIM_SAM_PERQTY: { type: "string" },
                        CSL_HAND_STITCH_SAM: { type: "string" },
                        CSL_WASH_SAM_PER_QTY: { type: "string" }
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
            columns: [
                    { selectable: true, width: "44px" },
                    { field: "PN", title: "PN No."}, 
                    { field: "RELEASED", title: "Released PN"}, 
                    { field: "COUNTRY", title: "Country Key"}, 
                    { field: "CURRENCY", title: "Currency Key"}, 
                    { field: "TOTAL_COST", title: "Total Cost"}, 
                    { field: "MAIN_F1_COST", title: "Main Fab/Yarn Cost"}, 
                    { field: "TRIM_F1_COST", title: "Trim Fab/Yarn Cost"}, 
                    { field: "CENTRALPUR_TRIM_COST", title: "CentralPur Trim Cost"}, 
                    { field: "FTY_PUR_TRIM_COST", title: "Fty Pur Trim Cost"}, 
                    { field: "C_M_COST", title: "C&M Cost"}, 
                    { field: "WASHING_COST", title: "Washing Cost"}, 
                    { field: "WATER_TREATMENT_COST", title: "Water Treatment Cost"}, 
                    { field: "SP_PROCESS_COST", title: "Sp. Process Cost"}, 
                    { field: "FTY_TAX_AND_OTHERS", title: "Fty Tax and Others"}, 
                    { field: "LA_KNIT", title: "Loc. adj. Knit-CSL"}, 
                    { field: "LA_LINK", title: "Loc. adj. Link-CSL"}, 
                    { field: "LA_SEW", title: "Loc. adj. Sew-CSL"}, 
                    { field: "LA_FINISH", title: "Loc. adj. Finish-CSL"}, 
                    { field: "FS_MARK_UP", title: "FS Mark up"}, 
                    { field: "CSL_KNIT", title: "CSL A. Knit SAM/Qty"}, 
                    { field: "KNIT_SAM_QTY", title: "Knit SAM Qty"}, 
                    { field: "CSL_LINK_SAM_PER_QTY", title: "CSL Link SAM per Qty"}, 
                    { field: "SEW_SAM_PER_QTY", title: "Sew SAM per Qty"}, 
                    { field: "CSL_FINISH_AMTQTY", title: "CSL Finish Amt/Qty"}, 
                    { field: "CSL_FINISH_OTH_SAM", title: "CSL Finish Other SAM"}, 
                    { field: "KNIT_TRIM_SAM_PERQTY", title: "Knit Trim SAM perQty"}, 
                    { field: "CSL_HAND_STITCH_SAM", title: "CSL Hand Stitch(SAM)"}, 
                    { field: "CSL_WASH_SAM_PER_QTY", title: "CSL Wash SAM per Qty"}
            ]
        });

        resultgridDataSource.read();
    }


    function DisplayGridonSelect(e) {

        selectedRst.PNReleased = [];
        const rows = e.sender.select();
        rows.each(function(e) {

            let dataItem = resultgrid.data("kendoGrid").dataItem(this);
            if (dataItem.RELEASED.length > 0) {
                //$(this).removeClass("k-state-selected");
            } else {
                let p = new Object();
                p.PN = dataItem.PN;
                p.RELEASED = dataItem.RELEASED;
                selectedRst.PNReleased.push(p);
            }

            //console.log(dataItem);
        })

        if (selectedRst.PNReleased.length < 1) {
            $('#btnApprove').attr('disabled', 'disabled');
        } else {
            $('#btnApprove').removeAttr('disabled');
        }
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
            url: "PN.ashx",
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
            url: "PN.ashx",
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
            url: "PN.ashx",
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
