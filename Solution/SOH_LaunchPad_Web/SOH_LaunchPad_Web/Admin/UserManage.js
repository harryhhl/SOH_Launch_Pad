'use strict';

Start();

function Start() 
{
    const urlParams = new URLSearchParams(window.location.search);

    var FuncID = urlParams.get('fid');
    var AccessToken = localStorage.getItem('SOH_Token');
    var UserName = localStorage.getItem('SOH_Username');

    var FunctionList = null;
    var RoleFunctions = null;
    var RoleList = null;
    var CAList = null;

    $(document).ready(Begin);

    function Begin()
    {
        GetUserList();
        GetCAList();
        GetFunctionListAll();
        GetRoleList();
        InitOthers();

        CheckInitReady();        
    }

    function InitOthers()
    {
        $("#tabstrip").kendoTabStrip({
            animation:  {
                open: {
                    effects: "fadeIn"
                }
            }
        });

        $('#dvRoleFuncAccess button[name=btnSaveChanges]').on( 'click', function(){
            kendo.confirm("Are you sure to proceed to change?").then(function () {
                OnRoleFunctionSaveChanges();
            }, function () {
                //cancel
            });
        });

        $('#dvRoleCENAccess button[name=btnSaveChanges]').on( 'click', function(){
            kendo.confirm("Are you sure to proceed to change?").then(function () {
                OnRoleCASaveChanges();
            }, function () {
                //cancel
            });
        });

        $('#dvRoleUsers button[name=btnSaveChanges]').on( 'click', function(){
            kendo.confirm("Are you sure to proceed to change?").then(function () {
                OnRoleUserSaveChanges();
            }, function () {
                //cancel
            });
        });

        $('#btnRefresh').on( 'click', function(){
            window.parent.postMessage("[RefreshME]", "*");
        });
    }

    function CheckInitReady()
    {
        if(FunctionList != null && RoleFunctions != null && CAList != null) {
            BuildContent();
            ShowLoading(false);
        }
        else {
            setTimeout(CheckInitReady, 500);
        }
    }

    function ShowLoading(show) {
        if(show)
            kendo.fx($("#dvLoadingOverlay")).fade("in").play();
        else
            kendo.fx($("#dvLoadingOverlay")).fade("out").play();
    }

    function BuildRoleList()
    {
        $('#dvRoleFuncAccess input[name=roleList]').kendoDropDownList({
            filter: "contains",
            dataTextField: "Name",
            dataValueField: "Id",
            dataSource: RoleList,
            index: 0,
            change: RoleListFuncAccessOnChange
        });

        $('#dvRoleCENAccess input[name=roleList]').kendoDropDownList({
            filter: "contains",
            dataTextField: "Name",
            dataValueField: "Id",
            dataSource: RoleList,
            index: 0,
            change: RoleListCENAccessOnChange
        });

        $('#dvRoleUsers input[name=roleList]').kendoDropDownList({
            filter: "contains",
            dataTextField: "Name",
            dataValueField: "Id",
            dataSource: RoleList,
            index: 0,
            change: RoleListUsersOnChange
        });

        if(RoleList.length>0)
        {
            RoleListFuncAccessOnChange();
            RoleListCENAccessOnChange();
            RoleListUsersOnChange();
        }
    }

    function BuildCAList()
    {
        $('#dvCAList').empty();

        var content = '<ul class="CAlist">';

        for(var i=0; i<CAList.length; i++) {
            var item = CAList[i];
            content += '<li>';
            content += '<label for="txt'+item+'">'+item+'</label>';
            content += '<textarea id="txt'+item+'" data="'+item+'" class="k-textbox" style="width: 100%;"></textarea>';
            content += '</li>';
        }

        content += '</ul>';

        $('#dvCAList').append(content);
    }

    function BuildUserList(data)
    {
        $('#dvUsers input[name=userList]').kendoDropDownList({
            filter: "contains",
            dataTextField: "Name",
            dataValueField: "Id",
            dataSource: data,
            index: 0,
            change: UserListOnChange
        });
    }

    function RoleListFuncAccessOnChange() {
        var CurrrentSelectRoleID = $('#dvRoleFuncAccess input[name=roleList]').val();
        RoleFunctions = null;
        GetRoleFuncList(CurrrentSelectRoleID);
        CheckInitReady();
    };

    function RoleListCENAccessOnChange() {
        var CurrrentSelectRoleID = $('#dvRoleCENAccess input[name=roleList]').val();
        GetRoleCAList(CurrrentSelectRoleID);
    };

    function RoleListUsersOnChange() {
        var CurrrentSelectRoleID = $('#dvRoleUsers input[name=roleList]').val();
        GetRoleUserList(CurrrentSelectRoleID);
    };

    function UserListOnChange() {
        var CurrrentSelectUserID = $('#dvUsers input[name=userList]').val();
        GetUserDetail(CurrrentSelectUserID);
    }


    function OnRoleFunctionSaveChanges() {
        var listBox = $("#opRoleSelected").data("kendoListBox");
        var items = listBox.dataItems().map(x=>x.value);
        var CurrrentSelectRoleID = $('#dvRoleFuncAccess input[name=roleList]').val();
        UpdateRoleFunc(items.join(','), CurrrentSelectRoleID);
    }

    function OnRoleCASaveChanges() {
        var list = [];
        $('#dvRoleCENAccess textarea').each(function(){  
            var item = {};
            item.Id = $(this).attr('data');
            item.Name = $(this).val();
            list.push(item);
        });
        var CurrrentSelectRoleID = $('#dvRoleCENAccess input[name=roleList]').val();
        UpdateRoleCA(JSON.stringify(list), CurrrentSelectRoleID);
    }

    function OnRoleUserSaveChanges() {
        var data = $('#dvRoleUsers textarea').val();
        data = data.replace(/(?:\r\n|\r|\n)/g, ',');
        var CurrrentSelectRoleID = $('#dvRoleUsers input[name=roleList]').val();
        UpdateRoleUser(data, CurrrentSelectRoleID);
    }

    function FillRoleCA(RoleCAList)
    {
        $('#dvRoleCENAccess textarea').each(function(){  
            $(this).val("");
        });

        for(var i=0; i<RoleCAList.length; i++) {
            var name = RoleCAList[i].Id;
            var value = RoleCAList[i].Name;
            var d = $('#txt'+name);
            if(typeof d != typeof undefined) {
                d.val(value);
            }
        }
    }

    function BuildContent()
    {
        $('#dvLBRole').empty();

        var content = "";

        content += '<label for="opRoleAvailable" style="width: 50%;">Available</label>';
        content += '<label for="opRoleSelected">Current</label>';
        content += '<br />';
        content += '<select id="opRoleAvailable" >';

        for(var i=0; i<FunctionList.length; i++) {
            var name = FunctionList[i].Name.replace("####", " &#10551; ");
            if(RoleFunctions.includes(FunctionList[i].Id) == false)
                content += '<option value="'+FunctionList[i].Id+'">'+name+'</option>';
        }

        content += '</select>';
        content += '<select id="opRoleSelected">';
        for(var i=0; i<FunctionList.length; i++) {
            var name = FunctionList[i].Name.replace("####", " &#10551; ");
            if(RoleFunctions.includes(FunctionList[i].Id) == true)
                content += '<option value="'+FunctionList[i].Id+'">'+name+'</option>';
        }
        content += '</select>';
        
        $('#dvLBRole').append(content);

        
        $("#opRoleAvailable").kendoListBox({
            draggable: true,
            dropSources: ["opRoleSelected"],
            connectWith: "opRoleSelected",
            //selectable: "multiple",
            toolbar: {
                tools: ["transferTo", "transferFrom", "transferAllTo", "transferAllFrom"]
            }
        });

        $("#opRoleSelected").kendoListBox({
            draggable: true,
            dropSources: ["opRoleAvailable"],
            connectWith: "opRoleAvailable",
            //selectable: "multiple",
        });
    }

    function SetRoleUserList(data)
    {
        var list = data.join("\n");
        $('#dvRoleUsers textarea').val(list);
        var o = document.getElementById('txtUserList');
        o.style.height = "1px";
        o.style.height = (25+o.scrollHeight)+"px";
    }

    function FillUserDetail(data)
    {
        var list_role = [];
        var list_func = [];
        for(var i=0; i<RoleList.length; i++) {
            if(data.RoleList.includes(RoleList[i].Id)) {
                list_role.push(RoleList[i].Name);
            }
        }

        for(var i=0; i<FunctionList.length; i++) {
            if(data.FuncList.includes(FunctionList[i].Id)) {
                list_func.push(FunctionList[i].Name);
            }
        }

        $('#txtRoleList').val(list_role.join("\n"));
        $('#txtFuncList').val(list_func.join("\n"));

        var o = document.getElementById('txtRoleList');
        o.style.height = "1px";
        o.style.height = (25+o.scrollHeight)+"px";

        o = document.getElementById('txtFuncList');
        o.style.height = "1px";
        o.style.height = (25+o.scrollHeight)+"px";

    }


    function GetFunctionListAll() 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "UserManage.ashx",
            data: {
                Action: "getfunclist",
                Token: AccessToken,
                FuncID: FuncID,
                User: UserName      
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText);
                alert(request.statusText);
            },
            success: function (data) {
                FunctionList = data;
            }
        });
    }

    function GetRoleFuncList(roleID) 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "UserManage.ashx",
            data: {
                Action: "getrolefunc",
                Token: AccessToken,
                FuncID: FuncID,
                User: UserName,
                Role: roleID
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText);
                alert(request.statusText);
            },
            success: function (data) {
                RoleFunctions = data;
            }
        });
    }

    function GetRoleList() 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "UserManage.ashx",
            data: {
                Action: "getrolelist",
                Token: AccessToken,
                FuncID: FuncID,
                User: UserName
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText);
                alert(request.statusText);
            },
            success: function (data) {
                RoleList = data;
                BuildRoleList();
            }
        });
    }

    function GetCAList() 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "UserManage.ashx",
            data: {
                Action: "getcenrtric",
                Token: AccessToken,
                FuncID: FuncID,
                User: UserName
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText);
                alert(request.statusText);
            },
            success: function (data) {
                CAList = data;
                BuildCAList();
            }
        });
    }

    function GetRoleCAList(roleID) 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "UserManage.ashx",
            data: {
                Action: "getroleca",
                Token: AccessToken,
                FuncID: FuncID,
                User: UserName,
                Role: roleID
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText);
                alert(request.statusText);
            },
            success: function (data) {
                FillRoleCA(data);
            }
        });
    }

    function GetRoleUserList(roleID) 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "UserManage.ashx",
            data: {
                Action: "getroleuser",
                Token: AccessToken,
                FuncID: FuncID,
                User: UserName,
                Role: roleID
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText);
                alert(request.statusText);
            },
            success: function (data) {
                SetRoleUserList(data);
            }
        });
    }


    function UpdateRoleFunc(functionList, selectRoleID) 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "UserManage.ashx",
            data: {
                Action: "updrolefunc",
                Token: AccessToken,
                FuncID: FuncID,
                User: UserName,
                Role: selectRoleID,
                FuncList: functionList
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText);
                alert(request.statusText);
            },
            success: function (data) {
                alert("Update Success!");
            }
        });
    }

    function UpdateRoleCA(CAList, selectRoleID) 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "UserManage.ashx",
            data: {
                Action: "updroleca",
                Token: AccessToken,
                FuncID: FuncID,
                User: UserName,
                Role: selectRoleID,
                AccessList: CAList
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText);
                alert(request.statusText);
            },
            success: function (data) {
                alert("Update Success!");
            }
        });
    }

    function UpdateRoleUser(userList, selectRoleID) 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "UserManage.ashx",
            data: {
                Action: "updroleuser",
                Token: AccessToken,
                FuncID: FuncID,
                User: UserName,
                Role: selectRoleID,
                UserList: userList
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText);
                alert(request.statusText);
            },
            success: function (data) {
                alert("Update Success!");
            }
        });
    }

    function GetUserList() 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "UserManage.ashx",
            data: {
                Action: "getuserlist",
                Token: AccessToken,
                FuncID: FuncID,
                User: UserName
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText);
                alert(request.statusText);
            },
            success: function (data) {
                BuildUserList(data);
            }
        });
    }

    function GetUserDetail(userID) 
    {
        $.ajax({
            type: "POST",
            async: true,
            url: "UserManage.ashx",
            data: {
                Action: "getuseraccess",
                Token: AccessToken,
                FuncID: FuncID,
                User: UserName,
                LANID: userID
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            error: function (request, error) {
                console.log(request.statusText);
                alert(request.statusText);
            },
            success: function (data) {
                FillUserDetail(data);
            }
        });
    }

}