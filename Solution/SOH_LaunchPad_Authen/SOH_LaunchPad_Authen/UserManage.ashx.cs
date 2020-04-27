using System;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using System.Web;
using System.Data.SqlClient;
using System.Data;
using Newtonsoft.Json;
using Helper;

namespace SOH_LaunchPad_Authen
{
    /// <summary>
    /// Summary description for UserManage
    /// </summary>
    public class UserManage : IHttpHandler
    {
        public void ProcessRequest(HttpContext context)
        {
            if (HttpContext.Current.Request.HttpMethod == "POST")
            {
                string input;
                using (StreamReader reader = new StreamReader(context.Request.InputStream))
                {
                    input = reader.ReadToEnd();
                }

                var inputset = HttpUtility.ParseQueryString(input);
                var action = inputset.Get("Action");
                var token = inputset.Get("Token");
                var sysfuncid = inputset.Get("FuncID");
                var username = inputset.Get("User");

                try
                {
                    if (action == "getfunclist")
                    {
                        DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("SOHDB"), CommandType.Text,
                           $@"SELECT   [Id]
                                      ,[Name]
                                      ,[Sort]
                                      ,[ParentId]
                                  FROM [dbo].[SystemFunctions]");

                        FunctionMenus menu = new FunctionMenus();
                        if (rcd.Tables.Count > 0)
                        {
                            for (int r = 0; r < rcd.Tables[0].Rows.Count; r++)
                            {
                                var row = rcd.Tables[0].Rows[r];
                                SysFunction func = new SysFunction();
                                func.FuncID = row["Id"].ToString();
                                func.FuncName = row["Name"].ToString();
                                func.Sort = (int)row["Sort"];
                                func.ParentId = row["ParentId"].ToString();
                                menu.addNew(func);
                            }
                        }

                        var flatten = GetFlattenList(menu);

                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(RequestResult.Ok(flatten)));
                    }
                    else if (action == "getrolefunc")
                    {
                        var roleID = inputset.Get("Role");

                        DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("SOHDB"), CommandType.Text,
                           $@"SELECT   [FunctionID]
                                  FROM [dbo].[RoleFuncAccess] where [RoleID]='{roleID}'");

                        List<string> list = new List<string>();
                        if (rcd.Tables.Count > 0)
                        {
                            for (int r = 0; r < rcd.Tables[0].Rows.Count; r++)
                            {
                                var row = rcd.Tables[0].Rows[r];
                                list.Add(row["FunctionID"].ToString());
                            }
                        }

                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(RequestResult.Ok(list)));
                    }
                    else if (action == "getrolelist")
                    {
                        DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("SOHDB"), CommandType.Text,
                           $@"SELECT [Id], [Name] FROM [dbo].[Roles] order by Name asc");

                        List<SimpleItem> list = new List<SimpleItem>();
                        if (rcd.Tables.Count > 0)
                        {
                            for (int r = 0; r < rcd.Tables[0].Rows.Count; r++)
                            {
                                var row = rcd.Tables[0].Rows[r];
                                list.Add(new SimpleItem() { Id = row["Id"].ToString(), Name = row["Name"].ToString() });
                            }
                        }

                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(RequestResult.Ok(list)));
                    }
                    else if (action == "updrolefunc")
                    {
                        var roleID = inputset.Get("Role");
                        var functionList = inputset.Get("FuncList");

                        List<SqlParameter> paras = new List<SqlParameter>();
                        paras.Add(new SqlParameter("@RoleID", roleID));
                        paras.Add(new SqlParameter("@SystemFuncIDList", functionList));
                        paras.Add(new SqlParameter("@UpdateBy", username));
                        SqlHelper.ExecuteNonQuery(SqlHelper.GetConnection("SOHDB"), CommandType.StoredProcedure, "p_UpdateRoleFuncAccess", paras.ToArray());

                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(RequestResult.Ok()));
                    }
                    else if (action == "getcenrtric")
                    {
                        DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("SOHDB"), CommandType.Text,
                           $@"SELECT [Name] FROM [dbo].[CENRestrictConfig]");

                        List<string> list = new List<string>();
                        if (rcd.Tables.Count > 0)
                        {
                            for (int r = 0; r < rcd.Tables[0].Rows.Count; r++)
                            {
                                var row = rcd.Tables[0].Rows[r];
                                list.Add(row["Name"].ToString().Trim());
                            }
                        }

                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(RequestResult.Ok(list)));
                    }
                    else if (action == "getroleca")
                    {
                        var roleID = inputset.Get("Role");

                        DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("SOHDB"), CommandType.Text,
                           $@"SELECT [FieldName],[FieldValue] FROM [dbo].[RoleCENAccess] where RoleId='{roleID}'");

                        List<SimpleItem> list = new List<SimpleItem>();
                        if (rcd.Tables.Count > 0)
                        {
                            for (int r = 0; r < rcd.Tables[0].Rows.Count; r++)
                            {
                                var row = rcd.Tables[0].Rows[r];
                                list.Add(new SimpleItem() { Id = row["FieldName"].ToString().Trim(), Name = row["FieldValue"].ToString().Trim() });
                            }
                        }

                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(RequestResult.Ok(list)));
                    }
                    else if (action == "updroleca")
                    {
                        var roleID = inputset.Get("Role");
                        var updlist = inputset.Get("AccessList");

                        var list = JsonConvert.DeserializeObject<List<SimpleItem>>(updlist);

                        foreach(var item in list)
                        {
                            List<SqlParameter> paras = new List<SqlParameter>();
                            paras.Add(new SqlParameter("@RoleID", roleID));
                            paras.Add(new SqlParameter("@FieldName", item.Id));
                            paras.Add(new SqlParameter("@FieldValue", item.Name));
                            paras.Add(new SqlParameter("@UpdateBy", username));
                            SqlHelper.ExecuteNonQuery(SqlHelper.GetConnection("SOHDB"), CommandType.StoredProcedure, "p_UpdateRoleCENAccess", paras.ToArray());
                        }

                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(RequestResult.Ok()));
                    }
                    else if (action == "getroleuser")
                    {
                        var roleID = inputset.Get("Role");

                        DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("SOHDB"), CommandType.Text,
                           $@"SELECT  [UserName]
                                  FROM [dbo].[RoleUsers] where [RoleID]='{roleID}'");

                        List<string> list = new List<string>();
                        if (rcd.Tables.Count > 0)
                        {
                            for (int r = 0; r < rcd.Tables[0].Rows.Count; r++)
                            {
                                var row = rcd.Tables[0].Rows[r];
                                list.Add(row["UserName"].ToString());
                            }
                        }

                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(RequestResult.Ok(list)));
                    }
                    else if (action == "updroleuser")
                    {
                        var roleID = inputset.Get("Role");
                        var userList = inputset.Get("UserList");

                        List<SqlParameter> paras = new List<SqlParameter>();
                        paras.Add(new SqlParameter("@RoleID", roleID));
                        paras.Add(new SqlParameter("@UserNameList", userList));
                        paras.Add(new SqlParameter("@UpdateBy", username));
                        SqlHelper.ExecuteNonQuery(SqlHelper.GetConnection("SOHDB"), CommandType.StoredProcedure, "p_UpdateRoleUsers", paras.ToArray());

                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(RequestResult.Ok()));
                    }
                    else
                    {
                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(RequestResult.Error("No Action is defined")));
                    }
                }
                catch (Exception ex)
                {
                    context.Response.ContentType = "application/json";
                    context.Response.Write(JsonConvert.SerializeObject(RequestResult.Error(ex.Message)));
                }
            }
            else
            {
                context.Response.StatusCode = 405;
                context.Response.StatusDescription = "Sorry, only POST method allowed";
            }
        }

        private List<SimpleItem> GetFlattenList(FunctionMenus fm)
        {
            List<SimpleItem> list = new List<SimpleItem>();
            fm.Sort();

            foreach(SysFunction sysfunc in fm.Functions)
            {
                SimpleItem item = new SimpleItem();
                item.Id = sysfunc.FuncID;
                item.Name = sysfunc.FuncName;
                list.Add(item);

                foreach(SysFunction subfunc in sysfunc.childFunctions)
                {
                    SimpleItem subitem = new SimpleItem();
                    subitem.Id = subfunc.FuncID;
                    subitem.Name = $@"{sysfunc.FuncName}####{subfunc.FuncName}";
                    list.Add(subitem);
                }
            }

            return list;
        }

        private class SimpleItem
        {
            public string Id { get; set; }
            public string Name { get; set; }
        }

        public bool IsReusable
        {
            get
            {
                return false;
            }
        }
    }
}