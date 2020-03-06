'use strict';

Start();

function Start() 
{
    const urlParams = new URLSearchParams(window.location.search);
    var poType = urlParams.get('potype');
    var FuncID = urlParams.get('fid');
    var AccessToken = localStorage.getItem('SOH_Token');
    var Username = localStorage.getItem('SOH_Username');

    var resultgridDataSource = null;
    var resultgrid = null;

    var resultgridDetailDataSource = null;
    var resultgridDetail = null;

    var selectedPO = null;

    $(document).ready(Begin);

    function Begin()
    {
        GetReleasePref();
        GetMasterData();
        InitOthers();

        kendo.fx($("#dvLoadingOverlay")).fade("out").play();
    }

    function InitOthers()
    {
        $("#fromDocDate").kendoDatePicker({
            start: "day",
            depth: "day",
            format: "dd/MM/yyyy",
            dateInput: true
        });

        $("#toDocDate").kendoDatePicker({
            start: "day",
            depth: "day",
            format: "dd/MM/yyyy",
            dateInput: true
        });

        $('#btnRelease').on( 'click', function(){

            if(resultgridDetail != null)
                resultgridDetail.data('kendoGrid').dataSource.data([]);

            kendo.fx($("#dvLoadingOverlay")).fade("in").play();
            var reportData = BuildNewRequestData(false);
            CreateNewRequest(reportData);

            $('#btnDoRelease').show();
            $('#btnDoUnrelease').hide();
        });

        $('#btnUnrelease').on( 'click', function(){

            if(resultgridDetail != null)
                resultgridDetail.data('kendoGrid').dataSource.data([]);

            kendo.fx($("#dvLoadingOverlay")).fade("in").play();
            var reportData = BuildNewRequestData(true);
            CreateNewRequest(reportData);

            $('#btnDoRelease').hide();
            $('#btnDoUnrelease').show();
        });

        $("#btnDoRelease").on("click", function () {
            kendo.confirm("Are you sure to proceed to release?").then(function () {
                kendo.fx($("#dvLoadingOverlay")).fade("in").play();
                CreateNewRelease("release");
            }, function () {
                //cancel
            });
        });

        $("#btnDoUnrelease").on("click", function () {
            kendo.confirm("Are you sure to proceed to un-release?").then(function () {
                kendo.fx($("#dvLoadingOverlay")).fade("in").play();
                CreateNewRelease("unrelease");
            }, function () {
                //cancel
            });
        });
    }


    function GetListResultProcess(result_data)
    {
        InitResultGrid(result_data);
        kendo.fx($("#dvLoadingOverlay")).fade("out").play();
    }

    function InitResultGrid(result_data)
    {
        resultgridDataSource = new kendo.data.DataSource({
            data: {
                "items" : result_data
              },
            schema: {
                model: {
                    id: "number",
                    fields: {
                        number: { type: "string" },
                        companyCode: { type: "string" },
                        customerName: { type: "string" },
                        docType: { type: "string" }, 
                        createdDate: { type: "date" },
                        createdBy: { type: "string" }, 
                        vendorCode: { type: "string" }, 
                        vendorName: { type: "string" }, 
                        paymentTermCode : { type: "string" }, 
                        incotermCode : { type: "string" }, 
                        incotermLocation: { type: "string" }, 
                        purchasingOrganizationCode: { type: "string" }, 
                        purchasingGroupCode: { type: "string" }, 
                        currencyCode: { type: "string" },
                        exchangeRate: { type: "number" }
                    }
                },
                data: "items"
            },
        });

        resultgrid = $("#gridResultHeader").kendoGrid({
            autoBind: false,
            height: 400,
            dataSource: resultgridDataSource,
            sortable: true,
            reorderable: true,
            groupable: false,
            resizable: true,
            filterable: false,
            columnMenu: false,
            change: HeaderGridonSelect,
            //selectable: true,
            persistSelection: true,
            pageable: false,
            scrollable: true,
            columns: [
                    { selectable: true, width: "44px" },
                    { command: { text: "View Details", click: ShowPODetails }, title: " ", width: "120px" },                    
                    { field: "number", title: "PO No.", width: "100px" },
                    { title: "Total Amount", template: '#= GetPOTotalAmount(data) #', width: "100px" },
                    { field: "customerName", title: "Customer", width: "120px" },
                    { field: "createdDate", title: "Create Date", template: '#= kendo.toString(createdDate, "yyyy-MM-dd" ) #', width: "100px" },
                    { field: "createdBy", title: "Create By" , width: "120px"},
                    { field: "vendorCode", title: "Vendor Code", width: "100px" },
                    { field: "vendorName", title: "Vendor Name", width: "240px" },
                    { field: "paymentTermCode", title: "Payment Term", template: '#= GetPaymentTermDesc(paymentTermCode) #', width: "120px" },
                    { field: "incotermCode", title: "Incoterm", template: '#= GetIncoTermDesc(incotermCode) #', width: "120px" },
                    { field: "incotermLocation", title: "Incoterm Loc", width: "120px" },
                    { field: "purchasingOrganizationCode", title: "Purchasing Org" , width: "120px"},
                    { field: "purchasingGroupCode", title: "Purchasing Group", width: "120px" },
                    { field: "companyCode", title: "Company", template: '#= GetCompanyDesc(companyCode) #', width: "90px" },
                    { field: "currencyCode", title: "Currency" , width: "120px"},
                    { field: "docType", title: "Doc Type" , width: "120px"},                    
                    { field: "exchangeRate", title: "ExRate", width: "120px"}
            ]
        });     
        
        resultgridDataSource.read();
    }

    function ShowPODetails(e) 
    {
        e.preventDefault();

        var dataItem = this.dataItem($(e.currentTarget).closest("tr"));
        InitResultDetailGrid(dataItem);
    }

    function InitResultDetailGrid(selectedData)
    {
        resultgridDetailDataSource = new kendo.data.DataSource({
            data: {
                "items" : selectedData.items.filter(d=>d.deleted == false)
              },
            schema: {
                model: {
                    id: "number",
                    fields: {
                        number: { type: "string" },
                        deleted: { type: "boolean" },
                        materialNumber: { type: "string" },
                        materialGroup: { type: "string" }, 
                        materialShortText: { type: "string" }, 
                        plant: { type: "string" }, 
                        quantity: { type: "number" }, 
                        poUnit : { type: "string" }, 
                        priceUnit : { type: "number" },
                        orderPriceUnit: { type: "string" },  
                        amount : { type: "number" }, 
                        netPrice : { type: "number" }, 
                        price : { type: "number" }, 
                        exchangeRate: { type: "number" },
                        currencyCode: { type: "string" }, 
                        deliveryDate: { type: "date" },
                        io: { type: "string" }, 
                        stockCategory: { type: "string" }
                    }
                },
                data: "items"
            },
        });

        resultgridDetail = $("#gridResultDetail").kendoGrid({
            autoBind: false,
            height: 250,
            dataSource: resultgridDetailDataSource,
            sortable: true,
            reorderable: true,
            groupable: false,
            resizable: true,
            filterable: false,
            columnMenu: false,
            selectable: true,
            persistSelection: true,
            pageable: false,
            scrollable: true,
            detailTemplate: kendo.template($("#template").html()),
            detailInit: DetailDiscountInit,
            columns: [
                    { field: "number", title: "No.", width: "80px" },
                    { field: "materialNumber", title: "Mat Num", width: "100px" },
                    { field: "materialGroup", title: "Mat Group" , width: "100px"},
                    { field: "materialShortText", title: "Mat Text", width: "180px" },
                    { field: "plant", title: "Plant", width: "100px"  },
                    { field: "quantity", title: "Qty", width: "100px"  },
                    { field: "poUnit", title: "PO Unit", width: "100px"  },
                    { field: "priceUnit", title: "Price Unit", width: "100px"  },
                    { field: "orderPriceUnit", title: "OrderPrice Unit", width: "100px"  },
                    { field: "amount", title: "Amount", width: "100px"  },
                    { field: "netPrice", title: "Net Price", width: "100px"  },
                    { field: "price", title: "Price", width: "100px"  },
                    { field: "exchangeRate", title: "ExRate", width: "100px"  },
                    { field: "currencyCode", title: "Currency" , width: "100px" },
                    { field: "deliveryDate", title: "Delivery Date", template: '#= kendo.toString(deliveryDate, "yyyy-MM-dd" ) #', width: "100px" },
                    { field: "io", title: "io" },
                    { field: "stockCategory", title: "Stock Category", width: "100px" }
            ]
        });     
        
        resultgridDetailDataSource.read();
    }

    function HeaderGridonSelect(arg) 
    {
        selectedPO = this.selectedKeyNames().join(", ");
        if(selectedPO.length < 1) {
            $('#btnDoRelease').attr('disabled', 'disabled');
            $('#btnDoUnrelease').attr('disabled', 'disabled');
        } else {
            $('#btnDoRelease').removeAttr('disabled');
            $('#btnDoUnrelease').removeAttr('disabled');
        }
        //var grid = resultgrid.data("kendoGrid");
        //var selectedItem = grid.dataItem(grid.select());
        //InitResultDetailGrid(selectedItem);

        console.log("The selected product ids are: [" + this.selectedKeyNames().join(", ") + "]");
    }

    function DetailDiscountInit(e)
    {
        var detailRow = e.detailRow;

        detailRow.find(".tabstrip").kendoTabStrip({
            animation: {
                open: { effects: "fadeIn" }
            }
        });

        detailRow.find(".discounts").kendoGrid({
            dataSource: {
                data: {
                    "items" : e.data.discounts
                  },
                schema: {
                    model: {
                        id: "number",
                        fields: {
                            number: { type: "string" },
                            stepNumber: { type: "string" },
                            code: { type: "string" }, 
                            amount: { type: "number" }, 
                            action: { type: "string" }, 
                            count: { type: "number" }
                        }
                    },
                    data: "items"
                },
            },
            scrollable: false,
            sortable: true,
            pageable: false,
            columns: [
                { field: "number", title:"Num", width: "140px" },
                { field: "stepNumber", title:"Step Num", width: "120px" },
                { field: "code", title:"Code", width: "100px" },
                { title:"Name", template: '#= GetDiscountDesc(code) #', width: "200px"},
                { field: "amount", title: "Amount", width: "100px" },
                { field: "action", title: "Action", width: "200px" },
                { field: "count", title: "Count", width: "100px"}
            ]
        });
    }

    function BuildNewRequestData(released)
    {
        var request = new Object();
        request.releaseCode = $("#releaseCode").val();
        request.releaseGroup = $("#releaseGroup").val();
        request.fromPONumber = $("#fromPONumber").val();
        request.toPONumber = $("#toPONumber").val();
        request.fromVendorCode = $("#fromVendorCode").val();
        request.toVendorCode = $("#toVendorCode").val();
        request.releaseGroup = $("#releaseGroup").val();
        request.released = released;

        var datefrom = $("#fromDocDate").data("kendoDatePicker").value();
        var dateto = $("#toDocDate").data("kendoDatePicker").value();

        request.fromDocDate = kendo.toString(datefrom, "ddMMyyyy");
        request.toDocDate = kendo.toString(dateto, "ddMMyyyy");

        return request;

    }

    function CreateNewRequest(data) 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "POApproval.ashx",
            data: {
                Action: "list",
                Token: AccessToken,
                User: Username,
                FuncID: FuncID,
                poType: poType,
                releaseCode: data.releaseCode,
                releaseGroup: data.releaseGroup,
                released: data.released,
                fromDocDate: data.fromDocDate,
                toDocDate: data.toDocDate,
                fromPONumber: data.fromPONumber,
                toPONumber: data.toPONumber,
                fromVendorCode: data.fromVendorCode,
                toVendorCode: data.toVendorCode
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

    function CreateNewRelease(action) 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "POApproval.ashx",
            data: {
                Action: action,
                Token: AccessToken,
                User: Username,
                FuncID: FuncID,
                poType: poType,
                releaseCode: $("#releaseCode").val(),
                poNumber: selectedPO
            },
            contentType: "application/json; charset=utf-8",
            //dataType: "json",
            error: function (request, error, customError) {
                console.log(request.statusText + ";" + error);
                alert(request.statusText + ";" + error);
            },
            success: function (data) {
                console.log(data);
                parent.postMessage("[UpdateBadge]funcID:"+FuncID+";poType:"+poType, "*");
                alert("Success");                
                var reportData = BuildNewRequestData(action == "unrelease");
                CreateNewRequest(reportData);
            },
            complete: function (data) {
                kendo.fx($("#dvLoadingOverlay")).fade("out").play();
            }
        });
    }

    function GetReleasePref() 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "POApproval.ashx",
            data: {
                Action: "getPref",
                Token: AccessToken,
                User: Username,
                FuncID: FuncID,
                poType: poType
            },
            contentType: "application/json; charset=utf-8",
            //dataType: "json",
            error: function (request, error, customError) {
                console.log(request.statusText + ";" + error);
                alert(request.statusText + ";" + error);
            },
            success: function (data) {
                if(data.releaseCode) {
                    if($("#releaseCode").val().length < 1) {
                        $("#releaseCode").val(data.releaseCode);
                    }
                }
            },
            complete: function (data) {
            }
        });
    }

    function GetMasterData() 
    {
        var test = sessionStorage.getItem('SOH_POApproval_companies');

        if(test == null) {
            //console.log("Master data not found.");
            $.ajax({
                type: "POST",
                async: true,
                url: "POApproval.ashx",
                data: {
                    Action: "master",
                    Token: AccessToken,
                    User: Username,
                    FuncID: FuncID,
                    poType: poType
                },
                contentType: "application/json; charset=utf-8",
                //dataType: "json",
                error: function (request, error, customError) {
                    console.log(request.statusText + ";" + error);
                },
                success: function (data) {
                    //console.log(data);
                    //console.log(data.companies);
                    sessionStorage.setItem('SOH_POApproval_companies', JSON.stringify(data.companies));
                    sessionStorage.setItem('SOH_POApproval_discounts', JSON.stringify(data.discounts));
                    sessionStorage.setItem('SOH_POApproval_incoterms', JSON.stringify(data.incoterms));
                    sessionStorage.setItem('SOH_POApproval_paymentTerms', JSON.stringify(data.paymentTerms));
                },
                complete: function (data) {
                }
            });
        } else {
            //console.log("Master data exists.");
        }
    }

}

function GetCompanyDesc(code)
{
    if(code.length < 1) return code;

    var list = JSON.parse(sessionStorage.getItem('SOH_POApproval_companies'));
    if(list == null)
        return code;
    else {
        for(var i=0; i<list.length; i++){
            if(list[i].code == code)
                return list[i].name + "("+ code+ ")";
        }

        return code;
    }
}

function GetPaymentTermDesc(code)
{
    if(code.length < 1) return code;
    
    var list = JSON.parse(sessionStorage.getItem('SOH_POApproval_paymentTerms'));
    if(list == null)
        return code;
    else {
        for(var i=0; i<list.length; i++){
            if(list[i].code == code)
                return list[i].name + "("+ code+ ")";
        }

        return code;
    }
}

function GetIncoTermDesc(code)
{
    if(code.length < 1) return code;
    
    var list = JSON.parse(sessionStorage.getItem('SOH_POApproval_incoterms'));
    if(list == null)
        return code;
    else {
        for(var i=0; i<list.length; i++){
            if(list[i].code == code)
                return list[i].name + "("+ code+ ")";
        }

        return code;
    }
}


function GetDiscountDesc(code)
{
    if(code.length < 1) return code;
    
    var list = JSON.parse(sessionStorage.getItem('SOH_POApproval_discounts'));
    if(list == null)
        return code;
    else {
        for(var i=0; i<list.length; i++){
            if(list[i].code == code)
                return list[i].name;
        }

        return code;
    }
}

function GetPOTotalAmount(data)
{
    var amount = 0.0;
    for(var i=0; i<data.items.length; i++){
        if(data.items[i].deleted == false)
            amount += data.items[i].amount;
    }
    return amount;
}