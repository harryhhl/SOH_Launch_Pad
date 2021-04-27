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

        window.onerror = top.onerror;
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
        htmlContent += '  <div class="sspcontrol-Text"><label for="PRNo" class="sspcontrol-desc">Purchase Requisition<label class="sspcontrol-req">*</label>:</label></div>';
        htmlContent += '  <div class="sspcontrol-Text"><input id="PRNo" name="PRNo" class="k-textbox" style="width:14ch" value="" maxlength="10" required></div>';
        htmlContent += '</div>'; 
        htmlContent += "</li>";

        htmlContent += "<li>";
        htmlContent += '<div class="sspcontrol" type="Text" style="display:flex; align-items:center; flex-wrap: wrap" >';
        htmlContent += '  <div class="sspcontrol-Text"><label for="RelCode" class="sspcontrol-desc">Release Code<label class="sspcontrol-req">*</label>:</label></div>';
        htmlContent += '  <div class="sspcontrol-Text"><input id="RelCode" name="RelCode" class="k-textbox" style="width:6ch" value="" maxlength="2" required></div>';
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
            
            if( type == 'Text' ) {
                let sel = {};
                sel.Name = $($(this).find('input')).attr('id');
                sel.Value = $($(this).find('input')).val().toUpperCase();

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

        $('#btnApprove').attr('disabled', 'disabled');
    }

    function GetListResultProcess(result_data) {

        selectedRst = {};
        selectedRst.PRNo = result_data[0].PR_NO;
        selectedRst.PRType = result_data[0].PR_TYPE;
        selectedRst.RelCode = result_data[0].RelCode;
        selectedRst.PRReleased = [];

        InitResultDvHeader(selectedRst.PRNo, selectedRst.PRType);
        InitResultGrid(result_data);

        if(result_data.length > 0) {
            $('#btnApprove').removeAttr('disabled');
            for(let i=0; i<result_data.length; i++) {
                let item = {};
                item.PRItemNo = result_data[i].PR_ITEM_NO;
                selectedRst.PRReleased.push(item);
            }
        }

        ShowLoading(false);
    }

    function InitResultDvHeader(PRNo, PRType) {
        let dvContent = $('#dvOrderHeader');
        let htmlContent = "";

        htmlContent += '<div class="k-block k-info-colored" style="margin-right: 0.5em; margin-top: 0.5em">';
        htmlContent += '<div class="k-header">Purchase Requisition</div>'+PRNo;
        htmlContent += '</div>';

        htmlContent += '<div class="k-block k-info-colored" style="margin-right: 0.5em; margin-top: 0.5em">';
        htmlContent += '<div class="k-header">Doc. Type</div>'+PRType;
        htmlContent += '</div>';

        dvContent.html(htmlContent);
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
                    id: "PR_ITEM_NO",
                    fields: GetResultGridSchema()
                },
                data: "items"
            },
        });

        resultgrid = $("#gridWA").kendoGrid({
            autoBind: false,
            height: 100 + result_data.length * 35,
            dataSource: resultgridDataSource,
            sortable: true,
            reorderable: true,
            groupable: false,
            resizable: true,
            filterable: false,
            columnMenu: false,
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

        if(true) {
            schema = {
                PR_ITEM_NO: { type: "string" },
                MATERIAL: { type: "string" },
                SHORT_TEXT: { type: "string" },
                QTY: { type: "number" },
                UNIT: { type: "string" },
                CD_DATE: { type: "string" },
                DELI_DATE: { type: "string" },
                PR_GROUP: { type: "string" },
                MAT_GROUP: { type: "string" },
                PLANT: { type: "string" }
            };
        }

        return schema;
    }

    function GetResultGridColumns()
    {
        let schema = null;

        if(true) {
            schema = [
                { field: "PR_ITEM_NO", title: "Item"}, 
                { field: "MATERIAL", title: "Material"}, 
                { field: "SHORT_TEXT", title: "Short Text"}, 
                { field: "QTY", title: "Qty Requested"}, 
                { field: "UNIT", title: "Unit"}, 
                { field: "CD_DATE", title: "CD"}, 
                { field: "DELI_DATE", title: "Deliv. Date"}, 
                { field: "PR_GROUP", title: "Pr Grp."}, 
                { field: "MAT_GROUP", title: "Mat Grp."}, 
                { field: "PLANT", title: "Plant"}
            ];
        }

        return schema;
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
            url: "PR.ashx",
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
            url: "PR.ashx",
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
            url: "PR.ashx",
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
