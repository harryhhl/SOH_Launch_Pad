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

    var kwDetailViewer = null;

    var selectedSO = null;
    var selectedDetailData = null;

    var kdApproveDialog = null;

    $(document).ready(Begin);

    function Begin() {
        LoadThemeSetting();

        GetActingApprover(function () {
            GetPendingList();
        });
        InitOthers();
    }

    function ShowLoading(show) {
        if (show)
            kendo.fx($("#dvLoadingOverlay")).fade("in").play();
        else
            kendo.fx($("#dvLoadingOverlay")).fade("out").play();
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

        $('#btnDisplay').on('click', function () {
            ShowLoading(true);
            GetPendingList();
        });

        $('#btnApprove').on('click', function () {
            ShowLoading(true);
            Approve();
        });

        InitKendoKW();
    }

    function LoadThemeSetting() {
        var t = localStorage.getItem('SOH_MainTheme');
        if (t == null) return;
        UpdateThemeCSS(t);
    }

    function UpdateThemeCSS(newTheme) {
        var targetelement = "link";
        var targetattr = "tag";
        var targetattrval = "themecss";
        var allsuspects = document.getElementsByTagName(targetelement);
        for (var i = allsuspects.length; i >= 0; i--) {
            if (allsuspects[i] && allsuspects[i].getAttribute(targetattr) != null && allsuspects[i].getAttribute(targetattr) == targetattrval) {
                var newelement = document.createElement("link");
                newelement.setAttribute("rel", "stylesheet");
                newelement.setAttribute("type", "text/css");
                newelement.setAttribute("href", "../../styles/kgrid_" + newTheme + ".css");
                newelement.setAttribute(targetattr, targetattrval);
                allsuspects[i].parentNode.replaceChild(newelement, allsuspects[i]);
            }
        }
    }

    function GetListResultProcess(result_data) {
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
                    fields: {
                        VBELN: { type: "string" },
                        STYLE_NO: { type: "string" },
                        STYLE_DESCRIPTION: { type: "string" },
                        NAME1: { type: "string" }
                    }
                },
                data: "items"
            },
        });

        resultgrid = $("#gridWA").kendoGrid({
            autoBind: false,
            height: 500,
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
            columns: [
                    { selectable: true, width: "44px" },
                    { command: { text: "View Details", click: ShowSODetails }, title: " ", width: "120px" },
                    { field: "VBELN", title: "Material No.", width: "120px" },
                    { field: "STYLE_NO", title: "Style No", width: "240px" },
                    { field: "STYLE_DESCRIPTION", title: "Style Description", width: "300px" },
                    { field: "NAME1", title: "Customer", width: "300px" }
            ]
        });

        resultgridDataSource.read();
    }

    function ShowSODetails(e) {
        ShowLoading(true);
        e.preventDefault();
        var dataItem = this.dataItem($(e.currentTarget).closest("tr"));
        GetDetail(dataItem.VBELN);
    }

    function DisplayGridonSelect(arg) {
        selectedSO = this.selectedKeyNames().join(",");
        if (selectedSO.length < 1) {
            $('#btnApprove').attr('disabled', 'disabled');
        } else {
            $('#btnApprove').removeAttr('disabled');
        }

        //console.log("The selected product ids are: [" + this.selectedKeyNames().join(", ") + "]");
    }

    function ShowApproveResult(rst) {
        var contentHtml = '<span style="display: inline-block; min-width: 120px"><strong>SO</strong></span>' +
                            '<span style="display: inline-block; min-width: 180px"><strong>Result</strong></span>' +
                            '<br><br>';
        for (var i = 0; i < rst.length; i++) {
            contentHtml += '<span style="display: inline-block; min-width: 120px">' + rst[i].VBELN + '</span>' +
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

        GetPendingList();
    }

    function InitActingApprover(result) {
        if (result == null || result.length <= 0)
            return;

        $("#dvApproverActing").show();

        var optionHtml = "";
        for (var i = 0; i < result.length; i++) {
            optionHtml += '<option value="' + result[i] + '">' + result[i] + '</option>';
        }
        $("#opApproverActing").html(optionHtml);

        $("#ckbApproverActing").change(function () {
            if (this.checked) {
                $("#opApproverActing").removeAttr('disabled');
                ActingApprover = $("#opApproverActing").children("option:selected").val();
                ShowLoading(true);
                GetPendingList();
            } else {
                {
                    $("#opApproverActing").attr('disabled', 'disabled');
                    ActingApprover = "";
                    ShowLoading(true);
                    GetPendingList();
                }
            }
        });

        $("#opApproverActing").change(function () {
            ActingApprover = $(this).children("option:selected").val();
            ShowLoading(true);
            GetPendingList();
        });
    }

    function InitKendoKW() {
        kwDetailViewer = $("#kwDetailViewer").kendoWindow(
        {
            width: (window.innerWidth - 40) + "px",
            height: (window.innerHeight - 200) + "px",
            title: "Pricing Detail",
            actions: ["Maximize", "Close"],
            resizable: true,
            modal: true,
            refresh: DetailViewerWindowOnRefresh,
            visible: false,
            position: {
                top: 10, // or "100px"
                left: 10
            }
        });
    }

    function DetailViewerWindowOpen(data) {
        if (kwDetailViewer != null) {
            selectedDetailData = data;
            kwDetailViewer.data("kendoWindow").refresh({
                url: "Detail.html",
                type: "GET"
            });

            kwDetailViewer.data("kendoWindow").open();
        }
    }

    function DetailViewerWindowOnRefresh() {
        //var pdfViewer = $("#pdfViewer").kendoPDFViewer({
        //    pdfjsProcessing: {
        //        file: {
        //            url: "getsodetail.ashx?sid="+selectedDetailSID,
        //            cMapUrl: '../../styles/pdfjs/cmaps/',
        //            cMapPacked: true
        //        }
        //    },              
        //    width: "100%",
        //    height: 700
        //}).data("kendoPDFViewer");
        var d = selectedDetailData;
        var header = d.T_HEAD[0];
        $('#dvHeader').empty();
        $('#dv_T_ITEM').empty();
        $('#dv_T_ITEM_GRID').empty();
        $('#dv_T_MAT').empty();
        $('#dv_T_PO').empty();
        $('#dv_T_PO_GROUP').empty();
        $('#dv_T_ZCKB').empty();
        $('#dv_T_GRID').empty();
        $('#dv_T_GROUP').empty();

        var c_head = "";
        c_head += '<div><span style="display:inline-block; width: 16em">Material No.</span><span>'+header.VBELN+'</span></div>';
        c_head += '<div><span style="display:inline-block; width: 16em">Customer Style No.</span><span>'+header.BNAME+'</span></div>';
        $('#dvHeader').append(c_head);

        if(d.T_MAT.length > 0) {
            var t_source = new kendo.data.DataSource({
                data: {
                    "items": d.T_MAT
                },
                schema: {
                    model: {
                        id: "KSCHL",
                        fields: {
                            KSCHL: { type: "string" },
                            KBETR: { type: "number" },
                            KONWA: { type: "string" },
                            KPEIN: { type: "string" },
                            KMEIN: { type: "string" },
                            KBSTAT: { type: "number" },
                            DATAB: { type: "string" },
                            TEXT: { type: "string" },
                            KFRST: { type: "string" }
                        }
                    },
                    data: "items"
                },
            });
    
            var t_grid = $("#dv_T_MAT").kendoGrid({
                autoBind: false,
                height: 50 + d.T_MAT.length * 25,
                dataSource: t_source,
                sortable: true,
                reorderable: true,
                groupable: false,
                resizable: false,
                filterable: false,
                columnMenu: false,
                pageable: false,
                scrollable: true,
                columns: [
                        { field: "KSCHL", title: "Condition Type", width: "120px" },
                        { field: "KBETR", title: "Rate", width: "100px" },
                        { field: "KONWA", title: "Currency", width: "90px" },
                        { field: "KPEIN", title: "Per", width: "80px" },
                        { field: "KMEIN", title: "UOM", width: "80px" },
                        { field: "KBSTAT", title: "Status For Conditions", width: "140px" },
                        { field: "DATAB", title: "Pricing Date", width: "120px" },
                        { field: "TEXT", title: "Approval Status", width: "200px" },                        
                        { field: "KFRST", title: "Release Status", width: "80px" }
                ]
            });
    
            t_source.read();
        }

        if(d.T_PO.length > 0) {
            var t_source = new kendo.data.DataSource({
                data: {
                    "items": d.T_PO
                },
                schema: {
                    model: {
                        id: "BSTKD",
                        fields: {
                            BSTKD: { type: "string" },
                            KSCHL: { type: "string" },
                            KBETR: { type: "number" },
                            KONWA: { type: "string" },
                            KPEIN: { type: "string" },
                            KMEIN: { type: "string" },
                            KBSTAT: { type: "number" },
                            DATAB: { type: "string" },
                            TEXT: { type: "string" },
                            KFRST: { type: "string" }
                        }
                    },
                    data: "items"
                },
            });
    
            var t_grid = $("#dv_T_PO").kendoGrid({
                autoBind: false,
                height: 50 + d.T_PO.length * 25,
                dataSource: t_source,
                sortable: true,
                reorderable: true,
                groupable: false,
                resizable: false,
                filterable: false,
                columnMenu: false,
                pageable: false,
                scrollable: true,
                columns: [
                        { field: "BSTKD", title: "PO No", width: "160px" },
                        { field: "KSCHL", title: "Condition Type", width: "120px" },
                        { field: "KBETR", title: "Rate", width: "100px" },
                        { field: "KONWA", title: "Currency", width: "90px" },
                        { field: "KPEIN", title: "Per", width: "80px" },
                        { field: "KMEIN", title: "UOM", width: "80px" },
                        { field: "KBSTAT", title: "Status For Conditions", width: "140px" },
                        { field: "DATAB", title: "Pricing Date", width: "120px" },
                        { field: "TEXT", title: "Approval Status", width: "200px" },                        
                        { field: "KFRST", title: "Release Status", width: "80px" }
                ]
            });
    
            t_source.read();
        }

        if(d.T_ITEM.length > 0) {
            var t_source = new kendo.data.DataSource({
                data: {
                    "items": d.T_ITEM
                },
                schema: {
                    model: {
                        id: "AUPOS",
                        fields: {
                            AUPOS: { type: "string" },
                            KSCHL: { type: "string" },
                            KBETR: { type: "number" },
                            KONWA: { type: "string" },
                            KPEIN: { type: "string" },
                            KMEIN: { type: "string" },
                            KBSTAT: { type: "number" },
                            DATAB: { type: "string" },
                            TEXT: { type: "string" },
                            KFRST: { type: "string" }
                        }
                    },
                    data: "items"
                },
            });
    
            var t_grid = $("#dv_T_ITEM").kendoGrid({
                autoBind: false,
                height: 50 + d.T_ITEM.length * 25,
                dataSource: t_source,
                sortable: true,
                reorderable: true,
                groupable: false,
                resizable: false,
                filterable: false,
                columnMenu: false,
                pageable: false,
                scrollable: true,
                columns: [
                        { field: "AUPOS", title: "SO Item", width: "120px" },
                        { field: "KSCHL", title: "Condition Type", width: "120px" },
                        { field: "KBETR", title: "Rate", width: "100px" },
                        { field: "KONWA", title: "Currency", width: "90px" },
                        { field: "KPEIN", title: "Per", width: "80px" },
                        { field: "KMEIN", title: "UOM", width: "80px" },
                        { field: "KBSTAT", title: "Status For Conditions", width: "140px" },
                        { field: "DATAB", title: "Pricing Date", width: "120px" },
                        { field: "TEXT", title: "Approval Status", width: "200px" },                        
                        { field: "KFRST", title: "Release Status", width: "80px" }
                ]
            });
    
            t_source.read();
        }

        if(d.T_ZCKB.length > 0) {
            var t_source = new kendo.data.DataSource({
                data: {
                    "items": d.T_ZCKB
                },
                schema: {
                    model: {
                        id: "KNUMV",
                        fields: {
                            KNUMV: { type: "string" },
                            KPOSN: { type: "string" },
                            KSCHL: { type: "string" },
                            J_3AETENR: { type: "string" },
                            KBETR: { type: "number" },
                            WAERS: { type: "string" },
                            KPEIN: { type: "string"},
                            KMEIN: { type: "string"}
                        }
                    },
                    data: "items"
                },
            });
    
            var t_grid = $("#dv_T_ZCKB").kendoGrid({
                autoBind: false,
                height: 50 + d.T_ZCKB.length * 25,
                dataSource: t_source,
                sortable: true,
                reorderable: true,
                groupable: false,
                resizable: false,
                filterable: false,
                columnMenu: false,
                pageable: false,
                scrollable: true,
                columns: [
                        { field: "KNUMV", title: "Document Condition", width: "140px" },
                        { field: "KPOSN", title: "Condition Item Number", width: "160px" },
                        { field: "KSCHL", title: "Condition Type", width: "140px" },
                        { field: "J_3AETENR", title: "Delivery Schedule Line", width: "180px" },
                        { field: "KBETR", title: "Quotation Price", width: "120px" },
                        { field: "WAERS", title: "Currency", width: "100px" },
                        { field: "KPEIN", title: "Per", width: "80px" },
                        { field: "KMEIN", title: "UOM", width: "80px" }
                ]
            });
    
            t_source.read();
        }

        if(d.T_GRID.length > 0){
            CreateTGridDetail(d.T_GRID, $("#dv_T_GRID"));
        }

        if(d.T_GROUP.length > 0){ 
            CreateTGridDetail(d.T_GROUP, $("#dv_T_GROUP"));
        }

        if(d.T_ITEM_GRID.length > 0){
            CreateTGridDetail(d.T_ITEM_GRID, $("#dv_T_ITEM_GRID"));
        }

        if(d.T_PO_GROUP.length > 0){
            CreateTGridDetail(d.T_PO_GROUP, $("#dv_T_PO_GROUP"));
        }
    }

    function CreateTGridDetail(dataset, div) {
        var t_source = new kendo.data.DataSource({
            data: {
                "items": dataset
            },
            schema: {
                model: {
                    id: "TYPE",
                    fields: {
                        TYPE: { type: "string" },
                        INITIAL: { type: "string" },
                        XSEQ: { type: "string" },
                        YSEQ: { type: "string" },
                        BSTKD: { type: "string" },
                        AUPOS: { type: "string" },
                        J_3ASZGR: { type: "string" },
                        J_3ASIZE: { type: "string" },
                        KSCHL: { type: "string" },
                        KBETR: { type: "number" },
                        KONWA: { type: "string" },
                        KPEIN: { type: "string" },
                        KMEIN: { type: "string" },
                        KBSTAT: { type: "number" },
                        DATAB: { type: "string" },
                        KFRST: { type: "string" },
                        INSEAM: { type: "string" },
                        J_3AENTX: { type: "string" },
                        KBETR_C: { type: "string" },
                        TEXT: { type: "string" }                        
                    }
                },
                data: "items"
            },
        });

        var t_grid = div.kendoGrid({
            autoBind: false,
            height: 50 + dataset.length * 25,
            dataSource: t_source,
            sortable: true,
            reorderable: true,
            groupable: false,
            resizable: false,
            filterable: false,
            columnMenu: false,
            pageable: false,
            scrollable: true,
            columns: [
                    { field: "TYPE", title: "TYPE", width: "60px" },
                    { field: "INITIAL", title: "INITIAL", width: "260px" },
                    { field: "XSEQ", title: "XSEQ", width: "40px" },
                    { field: "YSEQ", title: "YSEQ", width: "40px" },
                    { field: "BSTKD", title: "PO No", width: "160px" },
                    { field: "AUPOS", title: "SO Item", width: "120px" },
                    { field: "J_3ASZGR", title: "Grid Value Group", width: "120px" },
                    { field: "J_3ASIZE", title: "Grid Value", width: "100px" },
                    { field: "KSCHL", title: "Condition Type", width: "120px" },
                    { field: "KBETR", title: "Rate", width: "100px" },
                    { field: "KONWA", title: "Currency", width: "90px" },
                    { field: "KPEIN", title: "Per", width: "80px" },
                    { field: "KMEIN", title: "UOM", width: "80px" },
                    { field: "KBSTAT", title: "Status For Conditions", width: "140px" },
                    { field: "DATAB", title: "Pricing Date", width: "120px" },
                    { field: "KFRST", title: "Release Status", width: "80px" },
                    { field: "INSEAM", title: "INSEAM", width: "60px" },
                    { field: "J_3AENTX", title: "Grid Entry", width: "80px" },
                    { field: "KBETR_C", title: "RateC", width: "80px" },
                    { field: "TEXT", title: "Approval Status", width: "180px" }                      
            ]
        });

        t_source.read();
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

    function GetPendingList() {
        $.ajax({
            type: "POST",
            async: true,
            url: "Pricing.ashx",
            data: {
                Action: "list",
                Token: AccessToken,
                User: UserName,
                FuncID: FuncID,
                Approver: ActingApprover,
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText + ";" + error);
                alert(request.statusText + ";" + error);
            },
            success: function (data) {
                GetListResultProcess(data);
            }
        });
    }

    function GetActingApprover(callback) {
        $.ajax({
            type: "POST",
            async: true,
            url: "Pricing.ashx",
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
                alert(request.statusText + ";" + error);
            },
            success: function (data) {
                InitActingApprover(data);
                callback();
            }
        });
    }

    function GetDetail(sono) {
        $.ajax({
            type: "POST",
            async: true,
            url: "Pricing.ashx",
            data: {
                Action: "viewdetail",
                Token: AccessToken,
                User: UserName,
                FuncID: FuncID,
                SO: sono
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText + ";" + error);
                alert(request.statusText + ";" + error);
            },
            success: function (data) {
                //console.log(data);
                DetailViewerWindowOpen(data);
            },
            complete: function () {
                ShowLoading(false);
            }
        });
    }

    function Approve() {
        $.ajax({
            type: "POST",
            async: true,
            url: "Pricing.ashx",
            data: {
                Action: "approve",
                Token: AccessToken,
                User: UserName,
                FuncID: FuncID,
                Data: selectedSO,
                Approver: ActingApprover
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText + ";" + error);
                alert(request.statusText + ";" + error);
            },
            success: function (data) {
                //console.log(data);
                ShowApproveResult(data);
            }
        });
    }


}
