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

        window.onerror = top.onerror;
        
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

        let d = selectedDetailData;

        $('#dv_T_head').empty();
        $('#dv_T_MAT_head').empty();
        $('#dv_T_MAT').empty();
        $('#dv_T_MAT_GRIDGROUP_head').empty();
        $('#dv_T_MAT_GRIDGROUP').empty();
        $('#dv_T_MAT_GRID_head').empty();
        $('#dv_T_MAT_GRID').empty();
        $('#dv_T_PO_head').empty();
        $('#dv_T_PO').empty();
        $('#dv_T_SO_head').empty();
        $('#dv_T_SO').empty();
        $('#dv_T_PO_GRID_head').empty();
        $('#dv_T_PO_GRID').empty();
        $('#dv_T_SO_GRID_head').empty();
        $('#dv_T_SO_GRID').empty();
        $('#dv_T_ZCKB').empty();

        let titleMapping = [];
        titleMapping["KSCHL"] = "Condition Type";
        titleMapping["KBETR"] = "Rate";
        titleMapping["DATAB"] = "Pricing Date";
        titleMapping["COLOR"] = "Color/Size";
        titleMapping["BSTKD"] = "PO No";
        titleMapping["AUPOS"] = "SO Item";

        let excludeColumns = [];
        excludeColumns.push("TEXT");
        excludeColumns.push("KONWA");
        excludeColumns.push("KPEIN");
        excludeColumns.push("KMEIN");


        let c_head = "";
        c_head += '<div><span style="display:inline-block; width: 16em">Material No.</span><span>'+d.MaterialNo+'</span></div>';
        c_head += '<div><span style="display:inline-block; width: 16em">Customer Style No.</span><span>'+d.CustomerStyleNo+'</span></div>';
        $('#dv_T_head').append(c_head);

        let c_foot = "";
        c_foot += '<div><span>ZCKB Information</span></div>';
        c_foot += '<div style="display:inline-block;"><span>Quotation Price :</span><span>'+d.ZCKB_Quotation+'</span></div>';
        c_foot += '<div style="display:inline-block; width:10em"></div>';
        c_foot += '<div style="display:inline-block;"><span>Currency: </span><span>'+d.ZCKB_Currency+'</span></div>';
        c_foot += '<div style="display:inline-block; width:10em"></div>';
        c_foot += '<div style="display:inline-block;"><span>Per </span><span>'+d.ZCKB_PER+' '+d.ZCKB_UOM+'</span></div>';
        $('#dv_T_ZCKB').append(c_foot);

        if(d.Mat != null && d.Mat.length > 0) {
            let dataset = d.Mat;
            let firstItem = dataset[0];
            let t_head = "";
            t_head += '<div><span class="t-grid-head-title">By Material</span></div>';
            t_head += '<div style="display:inline-block;"><span>Approval Status: </span><span>'+firstItem.TEXT+'</span></div>';
            t_head += '<div style="display:inline-block; width:10em"></div>';
            t_head += '<div style="display:inline-block;"><span>Currency: </span><span>'+firstItem.KONWA+'</span></div>';
            t_head += '<div style="display:inline-block; width:10em"></div>';
            t_head += '<div style="display:inline-block;"><span>Per </span><span>'+firstItem.KPEIN+' '+firstItem.KMEIN+'</span></div>';
            $('#dv_T_MAT_head').append(t_head);

            let schema = GenerateKendoModel(dataset);
            let columns = GenerateKendoColumns(dataset, titleMapping, excludeColumns);

            CreateTGridDetail(dataset, schema, columns, $("#dv_T_MAT"));
            $("<br>").insertAfter($("#dv_T_MAT"));
        }

        if(d.MatGridGroup != null && d.MatGridGroup.length > 0) {
            let dataset = d.MatGridGroup;
            let firstItem = dataset[0];
            let t_head = "";
            t_head += '<div><span class="t-grid-head-title">By Material/By Grid Value Group</span></div>';
            t_head += '<div style="display:inline-block;"><span>Approval Status: </span><span>'+firstItem.TEXT+'</span></div>';
            t_head += '<div style="display:inline-block; width:10em"></div>';
            t_head += '<div style="display:inline-block;"><span>Currency: </span><span>'+firstItem.KONWA+'</span></div>';
            t_head += '<div style="display:inline-block; width:10em"></div>';
            t_head += '<div style="display:inline-block;"><span>Per </span><span>'+firstItem.KPEIN+' '+firstItem.KMEIN+'</span></div>';
            $('#dv_T_MAT_GRIDGROUP_head').append(t_head);

            let schema = GenerateKendoModel(dataset);
            let columns = GenerateKendoColumns(dataset, titleMapping, excludeColumns);

            CreateTGridDetail(dataset, schema, columns, $("#dv_T_MAT_GRIDGROUP"));
            $("<br>").insertAfter($("#dv_T_MAT_GRIDGROUP"));
        }

        if(d.MatGridValue != null && d.MatGridValue.length > 0) {
            let dataset = d.MatGridValue;
            let firstItem = dataset[0];
            let t_head = "";
            t_head += '<div><span class="t-grid-head-title">By Material/By Grid Value</span></div>';
            t_head += '<div style="display:inline-block;"><span>Approval Status: </span><span>'+firstItem.TEXT+'</span></div>';
            t_head += '<div style="display:inline-block; width:10em"></div>';
            t_head += '<div style="display:inline-block;"><span>Currency: </span><span>'+firstItem.KONWA+'</span></div>';
            t_head += '<div style="display:inline-block; width:10em"></div>';
            t_head += '<div style="display:inline-block;"><span>Per </span><span>'+firstItem.KPEIN+' '+firstItem.KMEIN+'</span></div>';
            $('#dv_T_MAT_GRID_head').append(t_head);

            let schema = GenerateKendoModel(dataset);
            let columns = GenerateKendoColumns(dataset, titleMapping, excludeColumns);

            CreateTGridDetail(dataset, schema, columns, $("#dv_T_MAT_GRID"));
            $("<br>").insertAfter($("#dv_T_MAT_GRID"));
        }

        if(d.MatPO != null && d.MatPO.length > 0) {
            let dataset = d.MatPO;
            let firstItem = dataset[0];
            let t_head = "";
            t_head += '<div><span class="t-grid-head-title">By Material / By PO</span></div>';
            t_head += '<div style="display:inline-block;"><span>Approval Status: </span><span>'+firstItem.TEXT+'</span></div>';
            t_head += '<div style="display:inline-block; width:10em"></div>';
            t_head += '<div style="display:inline-block;"><span>Currency: </span><span>'+firstItem.KONWA+'</span></div>';
            t_head += '<div style="display:inline-block; width:10em"></div>';
            t_head += '<div style="display:inline-block;"><span>Per </span><span>'+firstItem.KPEIN+' '+firstItem.KMEIN+'</span></div>';
            $('#dv_T_PO_head').append(t_head);

            let schema = GenerateKendoModel(dataset);
            let columns = GenerateKendoColumns(dataset, titleMapping, excludeColumns);

            CreateTGridDetail(dataset, schema, columns, $("#dv_T_PO"));
            $("<br>").insertAfter($("#dv_T_PO"));
        }
    
        if(d.MatSO != null && d.MatSO.length > 0) {
            let dataset = d.MatSO;
            let firstItem = dataset[0];
            let t_head = "";
            t_head += '<div><span class="t-grid-head-title">By Material/By SO Item</span></div>';
            t_head += '<div style="display:inline-block;"><span>Approval Status: </span><span>'+firstItem.TEXT+'</span></div>';
            t_head += '<div style="display:inline-block; width:10em"></div>';
            t_head += '<div style="display:inline-block;"><span>Currency: </span><span>'+firstItem.KONWA+'</span></div>';
            t_head += '<div style="display:inline-block; width:10em"></div>';
            t_head += '<div style="display:inline-block;"><span>Per </span><span>'+firstItem.KPEIN+' '+firstItem.KMEIN+'</span></div>';
            $('#dv_T_SO_head').append(t_head);

            let schema = GenerateKendoModel(dataset);
            let columns = GenerateKendoColumns(dataset, titleMapping, excludeColumns);

            CreateTGridDetail(dataset, schema, columns, $("#dv_T_SO"));
            $("<br>").insertAfter($("#dv_T_SO"));
        }

        if(d.MatPOGridGroup != null && d.MatPOGridGroup.length > 0) {
            $('#dv_T_PO_GRID_head').append('<div><span class="t-grid-head-title">By Material/By PO/By Grid Value Group</span></div>');
            for(var i=0; i<d.MatPOGridGroup.length; i++) {
                let dataset = d.MatPOGridGroup[i];
                let firstItem = dataset[0];
                let t_head = "";
                t_head += '<div style="display:inline-block;"><span>PO No. : </span><span>'+firstItem.BSTKD+'</span></div>';
                t_head += '<div style="display:inline-block; width:8em"></div>';
                t_head += '<div style="display:inline-block;"><span>Approval Status: </span><span>'+firstItem.TEXT+'</span></div>';
                t_head += '<div style="display:inline-block; width:8em"></div>';
                t_head += '<div style="display:inline-block;"><span>Currency: </span><span>'+firstItem.KONWA+'</span></div>';
                t_head += '<div style="display:inline-block; width:8em"></div>';
                t_head += '<div style="display:inline-block;"><span>Per </span><span>'+firstItem.KPEIN+' '+firstItem.KMEIN+'</span></div>';
                $('#dv_T_PO_GRID').append(t_head);
    
                let dv_grid_id = "dv_T_PO_GRID_"+i;
                let dv_grid = '<div id="'+dv_grid_id+'"></div><br>';
                $('#dv_T_PO_GRID').append(dv_grid);

                let schema = GenerateKendoModel(dataset);
                let columns = GenerateKendoColumns(dataset, titleMapping, excludeColumns);
    
                CreateTGridDetail(dataset, schema, columns, $("#"+dv_grid_id));
            }
            $("<br>").insertAfter($("#dv_T_PO_GRID"));
        }

        if(d.MatSOGridGroup != null && d.MatSOGridGroup.length > 0) {
            $('#dv_T_SO_GRID_head').append('<div><span class="t-grid-head-title">By Material/By SO/By Grid Value Group</span></div>');
            for(var i=0; i<d.MatSOGridGroup.length; i++) {
                let dataset = d.MatSOGridGroup[i];
                let firstItem = dataset[0];
                let t_head = "";
                t_head += '<div style="display:inline-block;"><span>SO Item: </span><span>'+firstItem.AUPOS+'</span></div>';
                t_head += '<div style="display:inline-block;"><span>Approval Status: </span><span>'+firstItem.TEXT+'</span></div>';
                t_head += '<div style="display:inline-block; width:10em"></div>';
                t_head += '<div style="display:inline-block;"><span>Currency: </span><span>'+firstItem.KONWA+'</span></div>';
                t_head += '<div style="display:inline-block; width:10em"></div>';
                t_head += '<div style="display:inline-block;"><span>Per </span><span>'+firstItem.KPEIN+' '+firstItem.KMEIN+'</span></div>';
                $('#dv_T_SO_GRID').append(t_head);

                let dv_grid_id = "dv_T_SO_GRID_"+i;
                let dv_grid = '<div id="'+dv_grid_id+'"></div><br>';
                $('#dv_T_SO_GRID').append(dv_grid);

                let schema = GenerateKendoModel(dataset);
                let columns = GenerateKendoColumns(dataset, titleMapping, excludeColumns);

                CreateTGridDetail(dataset, schema, columns, $("#"+dv_grid_id));
                $("#"+dv_grid_id).append("<br>");
            }
            $("<br>").insertAfter($("#dv_T_SO_GRID"));
        }
    }

    function GenerateKendoColumns(data, titlemapping, excludes)
    {
        let sampleDataItem = data[0];
        let columns = [];

        for (var property in sampleDataItem) {
            if(excludes.includes(property)) {  continue; }
            let title = titlemapping[property] ? titlemapping[property] : property;
            title = title.replace("SSSZZZ", "");
            columns.push({ field: property, title: title, template: (isDateField[property] ? "#= kendo.toString("+property+", \"yyyy-MM-dd\" ) #" : "#="+property+" != null? "+property+" : '' #") });
        }

        return columns;
    }

    var isDateField = [];
    function GenerateKendoModel(data) 
    {
        isDateField = [];
        let sampleDataItem = data[0];

        let model = {};
        let fields = {};
        for (var property in sampleDataItem) {
          if(property.indexOf("ID") !== -1){
            model["id"] = property;
          }
          var propType = typeof sampleDataItem[property];

          if (propType === "number" ) {
            fields[property] = {
              type: "number"
            };
          } else if (propType === "boolean") {
            fields[property] = {
              type: "boolean"
            };
          } else if (propType === "string") {
            var parsedDate = kendo.parseDate(sampleDataItem[property]);
            if (parsedDate) {
              fields[property] = {
                type: "date",
              };
              isDateField[property] = true;
            } else {
              fields[property] = {
                type: "string",
              };
            }
          } else {
            fields[property] = {
              validation: {
                required: true
              }
            };
          }
        }

        model.fields = fields;

        return model;
    }

    function CreateTGridDetail(dataset, schema, columns, div) {
        var t_source = new kendo.data.DataSource({
            data: {
                "items": dataset
            },
            schema: {
                model: schema,
                data: "items"
            },
        });

        var t_grid = div.kendoGrid({
            autoBind: false,
            height: 50 + dataset.length * 25,
            dataSource: t_source,
            sortable: true,
            reorderable: false,
            groupable: false,
            resizable: false,
            filterable: false,
            columnMenu: false,
            pageable: false,
            scrollable: false,
            columns: columns
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
