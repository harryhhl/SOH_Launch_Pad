'use strict';

Start();

function Start() 
{
    const urlParams = new URLSearchParams(window.location.search);

    var FuncID = urlParams.get('fid');
    var AccessToken = localStorage.getItem('SOH_Token');
    var UserName = localStorage.getItem('SOH_Username');
    var LookID = urlParams.get('lookup');

    var histgridDataSource = null;
    var histgrid = null;

    var alvgridDataSource = null;
    var alvgrid = null;

    var selectedQueueID = null;

    var dvResultALV = null;
    var dvResultFile = null;

    var listLayout = null;
    var listLayoutDS = null;

    var selectedReport = "";

    $(document).ready(Begin);

    function Begin()
    {
        LoadThemeSetting();

        InitHistGrid();
        HistGridReload();
        InitOthers();
        CheckInitReady();
    }

    function CheckInitReady()
    {
        if(histgrid !=null) {
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
        dvResultALV.hide();
        dvResultFile.hide();

        $('#btnDownloadFile').on( 'click', function(){
            if(selectedQueueID.length > 0) {
                DownloadFileData();
            }
        });

        $('.btnDownloadExcel').on( 'click', function() {
            var grid = alvgrid.data("kendoGrid");
            grid.saveAsExcel();
        });

        $('#btnToggle').on( 'click', function(){
            $('.GridHistoryWrapper').toggle();

            if(alvgrid != null)
                alvgrid.children(".k-grid-content").height(window.parent.innerHeight - 400);
        });

        $('#btnLayoutSave').on( 'click', function(){
            if (confirm("Are you sure to update this layout?")) {
                var dataItem = listLayout.data("kendoDropDownList").dataItem();
                var gridoption = alvgrid.data("kendoGrid").getOptions();
                UpdateLayout(dataItem.Id, dataItem.LayoutName, JSON.stringify(gridoption));
            }
        });

        $('#btnLayoutDefault').on( 'click', function(){
            if (confirm("Are you sure to make this layout default?")) {
                var dataItem = listLayout.data("kendoDropDownList").dataItem();
                MakeLayoutDefault(dataItem.Id);
            }
        });

        var eventMethod = window.addEventListener? "addEventListener" : "attachEvent";
        var eventer = window[eventMethod];
        var messageEvent = eventMethod === "attachEvent"? "onmessage" : "message";
        eventer(messageEvent, function (e) {
            
            if (e.data.startsWith("[UpdateTheme]")) 
                LoadThemeSetting();

        });
    }

    function InitLayoutDropList()
    {
        listLayoutDS = new kendo.data.DataSource({
            transport: {
                read:  {
                    url: "../Reports/SapReport.ashx",
                    dataType: "json",
                    type: "POST",
                    contentType: "application/json; charset=utf-8",
                    xhrFields: {
                        withCredentials: true
                    },
                    data: LayoutListDataSourceFilter("getrptlayout")
                },
                create: {
                    url: "../Reports/SapReport.ashx",
                    dataType: "json",
                    type: "POST",
                    contentType: "application/json; charset=utf-8",
                    xhrFields: {
                        withCredentials: true
                    },
                    data: LayoutListDataSourceFilter("newrptlayout")
                }
            },
            schema: {
                model: {
                    id: "Id",
                    fields: {
                        Id:  { type: "string" },
                        LayoutName: { type: "string" },
                        LayoutContent: { type: "string" },
                        IsDefault: { type: "boolean" }
                    }
                }
            }
        });

        listLayout = $("#listLayout").kendoDropDownList({
            filter: "startswith",
            dataTextField: "LayoutName",
            dataValueField: "LayoutContent",
            dataSource: listLayoutDS,
            noDataTemplate: $("#noLayoutListDataTemplate").html(),
            select: function(e) {
                var dataItem = e.dataItem;
                if(dataItem.LayoutContent.length > 1) {
                    alvgrid.data("kendoGrid").setOptions(JSON.parse(dataItem.LayoutContent));
                }
                else {
                    ALVGridLoadCurrentOption();
                }
            },
            dataBound: function(e) {
                listLayout.data("kendoDropDownList").select(function(dataItem) {

                    if(dataItem.IsDefault == true)
                    {
                        alvgrid.data("kendoGrid").setOptions(JSON.parse(dataItem.LayoutContent));
                        return true;
                    }

                    return false;
                });
            }

        });
    }

    function LayoutListDataSourceFilter(action)
    {
        var results = {};

        results.Action = action;
        results.Token = AccessToken;
        results.FuncID = FuncID;
        results.Report = selectedReport;
        results.User = UserName;

        return results;
    }


    function InitHistGrid()
    {
        histgridDataSource = new kendo.data.DataSource({
            transport: {
                read: {
                    url: "ReportQueue.ashx",
                    dataType: "json",
                    type: "POST",
                    contentType: "application/json; charset=utf-8",
                    xhrFields: {
                        withCredentials: true
                    },
                    data: HistGridDataSourceFilter,
                    complete: HistGridGetDataReturn,
                    error: function (xhr, error) {
                        console.debug(xhr); console.debug(error);
                    }
                }
            },
            schema: {
                model: {
                    id: "Id",
                    fields: {
                        Id: { type: "string" },
                        ReportDisplayName: { type: "string" },
                        CreateDate: { type: "date" },
                        UpdateDate: { type: "date" },
                        Status: { type: "string" },
                        LogMessage: { type: "string" },
                        OutputType: { type: "string" }
                    }
                },
                data: "ListData",
                total: "TotalCount"
            },
            pageSize: 10,
            serverPaging: false,
            serverFiltering: false,
            serverSorting: false
        });

        histgrid = $("#gridHistory").kendoGrid({
            autoBind: false,
            dataSource: histgridDataSource,
            height: 320,
            sortable: true,
            reorderable: false,
            groupable: false,
            resizable: false,
            filterable: true,
            columnMenu: false,
            change: HistGridonSelect,
            selectable: true,
            persistSelection: true,
            pageable: {
                refresh: true,
                numeric: true,
                previousNext: true,
                messages: {
                    display: "Showing {2} items"
                }
            },
            columns: [
                    { field: "Id", title: "Run ID", width: "180px" },
                    { field: "ReportDisplayName", title: "Report", width: "180px" },
                    { field: "CreateDate", title: "Create At", width: "90px", template: '#= kendo.toString(CreateDate, "yyyy-MM-dd HH:mm:ss" ) #' },
                    { field: "UpdateDate", title: "Last Update", width: "90px", template: '#= kendo.toString(UpdateDate, "yyyy-MM-dd HH:mm:ss" ) #' },
                    { field: "Status", title: "Status", width: "70px", 
                        template: function(dataItem) {
                                     if(dataItem.Status == 1)
                                        return "<strong>Success</strong>";
                                     else if(dataItem.Status == 0)
                                        return "<strong>Pending</strong>";
                                     else if(dataItem.Status == 2)
                                        return "<strong>Information</strong>";                                        
                                     else
                                        return "<strong>Failed</strong>";                                       
                                } 
                    },
                    { field: "LogMessage", title: "Message", width: "200px" },
                    { field: "OutputType", title: "Output", width: "70px" }
            ]
        });     
        
        //var gridData = histgrid.data("kendoGrid");
    }

    function HistGridReload() 
    {
        if(LookID != null && LookID.length>0) {
            histgridDataSource.filter( { field: "Id", operator: "eq", value: LookID });
        }
        
        histgridDataSource.read();
    }

    function HistGridonSelect(arg) 
    {
        selectedQueueID = this.selectedKeyNames().join(", ");
        var grid = histgrid.data("kendoGrid");
        var selectedItem = grid.dataItem(grid.select());

        selectedReport = selectedItem.ReportName;

        if(selectedItem.OutputType == "ALV") {

            dvResultALV.show();
            dvResultFile.hide();

            GetALVSchema();
            
            // if(alvgrid == null) {
            //     GetALVSchema();
            // }
            // else {
            //     ALVGridReload();
            // }
        }
        else if(selectedItem.OutputType == "File") {
            dvResultALV.hide();
            dvResultFile.show();
        }
        else {
            dvResultALV.hide();
            dvResultFile.hide();
        }
        //console.log("The selected product ids are: [" + this.selectedKeyNames().join(", ") + "]");
    }

    function HistGridDataSourceFilter()
    {
        var results = {};

        results.Action = "getqueue";
        results.Token = AccessToken;
        results.FuncID = FuncID;
        //results.Report = SelectedReport;

        return results;
    }

    function HistGridGetDataReturn(_jqXHR, _textStatus) 
    {
        var grid = histgrid.data("kendoGrid");
        var total = grid.dataSource.total();
        if(total > 0) {
            grid.dataSource.page(1);
            grid.refresh();
        }
    }

    function InitALVGrid(config)
    {
        alvgridDataSource = new kendo.data.DataSource({
            transport: {
                read: {
                    url: "../Reports/SapReport.ashx",
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
            autoBind: true,
            dataSource: alvgridDataSource,
            height: window.parent.innerHeight - 400,
            theme: "default",
            sortable: true,
            reorderable: true,
            groupable: true,
            resizable: true,
            filterable: true,
            columnMenu: true,
            selectable: "row",
            pageable: false,
            excel: {
                allPages: true
            },
            columns: JSON.parse(config.ColumnSetting)
        });     
        
        ALVGridSaveCurrentOption();
        InitLayoutDropList();
    }

    function ALVGridSaveCurrentOption()
    {
        var option = alvgrid.data("kendoGrid").getOptions();
        localStorage.setItem('SOH_ReportLayoutCurrent', kendo.stringify(option));
    }

    function ALVGridLoadCurrentOption()
    {
        var option = localStorage.getItem('SOH_ReportLayoutCurrent');
        alvgrid.data("kendoGrid").setOptions(JSON.parse(option)); 
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
        results.Report = selectedReport;
        results.QID = selectedQueueID;

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


    function GetALVSchema() 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "../Reports/SapReport.ashx",
            data: {
                Action: "getalvschema",
                Token: AccessToken,
                FuncID: FuncID,
                Report: selectedReport,
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
            url: "../Reports/SapReport.ashx",
            data: {
                Action: "getfiledata",
                Token: AccessToken,
                FuncID: FuncID,
                Report: selectedReport,
                Data: '',
                QID:  selectedQueueID
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

    function UpdateLayout(id, name, content) 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "../Reports/SapReport.ashx",
            data: {
                Action: "updrptlayout",
                Token: AccessToken,
                FuncID: FuncID,
                Report: selectedReport,
                LayoutID: id,
                LayoutName: name,
                LayoutContent: content     
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText);
                alert(request.statusText);
            },
            success: function (data) {
                alert("success!");
                listLayoutDS.read();
            }
        });
    }

    function MakeLayoutDefault(id) 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "../Reports/SapReport.ashx",
            data: {
                Action: "updrptlayoutdefault",
                Token: AccessToken,
                FuncID: FuncID,
                Report: selectedReport,
                LayoutID: id 
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText);
                alert(request.statusText);
            },
            success: function (data) {
                alert("success!");
            }
        });
    }

    function LoadThemeSetting()
    {
        var t = localStorage.getItem('SOH_MainTheme');
        if(t == null) return;
        UpdateThemeCSS(t);
    }

    function UpdateThemeCSS(newTheme)
    {
        var targetelement = "link";
        var targetattr = "tag";
        var targetattrval = "themecss";
        var allsuspects = document.getElementsByTagName(targetelement);
        for (var i=allsuspects.length; i>=0; i--) { 
            if (allsuspects[i] && allsuspects[i].getAttribute(targetattr)!=null && allsuspects[i].getAttribute(targetattr)==targetattrval) {
                var newelement = document.createElement("link");
                newelement.setAttribute("rel", "stylesheet");
                newelement.setAttribute("type", "text/css");
                newelement.setAttribute("href", "reportqueue_"+newTheme+".css");  
                newelement.setAttribute(targetattr, targetattrval);           
                allsuspects[i].parentNode.replaceChild(newelement, allsuspects[i]);
            }
        }
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

function AddNewLayout(widgetId, value) {
    var widget = $("#" + widgetId).getKendoDropDownList();
    var dataSource = widget.dataSource;

    if (confirm("Are you sure to add this layout?")) {

        var gridoption = $("#gridResult").data("kendoGrid").getOptions();

        dataSource.add({
            Id: "",
            LayoutName: value,
            LayoutContent: kendo.stringify(gridoption)
        });

        dataSource.one("sync", function() {
            widget.select(dataSource.view().length - 1);
        });

        dataSource.sync();
    }
};

  