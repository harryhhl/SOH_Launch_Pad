using System;
using System.Collections.Generic;
using System.Web;
using Newtonsoft.Json;
using System.IO;
using System.Data;
using System.Linq;
using Helper;
using System.Data.SqlClient;

namespace SOH_LaunchPad_CENReport
{
    /// <summary>
    /// Summary description for ReportLayout
    /// </summary>
    public class ReportLayout : IHttpHandler
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
                var reportname = inputset.Get("Report");

                try
                {
                    if (action == "getrptlayout")
                    {
                        var layoutlist = GetReportLayoutByUser(reportname, username);

                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(RequestResult.Ok(layoutlist)));
                    }
                    else if (action == "newrptlayout")
                    {
                        var layoutname = inputset.Get("LayoutName");
                        var layoutcontent = inputset.Get("LayoutContent");

                        var layoutId = CreateNewReportLayout(reportname, username, layoutname, layoutcontent);

                        List<ReportLayoutData> list = new List<ReportLayoutData>();
                        list.Add(new ReportLayoutData() { Id = layoutId, LayoutName = layoutname, LayoutContent = layoutcontent });

                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(RequestResult.Ok(list)));

                    }
                    else if (action == "updrptlayout")
                    {
                        var layoutID = inputset.Get("LayoutID");
                        var layoutname = inputset.Get("LayoutName");
                        var layoutcontent = inputset.Get("LayoutContent");

                        UpdateReportLayout(layoutID, layoutname, layoutcontent);

                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(RequestResult.Ok()));
                    }
                    else if (action == "updrptlayoutdefault")
                    {
                        var layoutID = inputset.Get("LayoutID");

                        UpdateReportLayoutDefault(layoutID, username);

                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(RequestResult.Ok()));
                    }
                    else if (action == "updrptlayoutpublic")
                    {
                        var layoutID = inputset.Get("LayoutID");
                        var setPublic = bool.Parse(inputset.Get("public"));

                        UpdateReportLayoutPublic(layoutID, setPublic);

                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(RequestResult.Ok()));
                    }
                    else if (action == "delrptlayout")
                    {
                        var layoutID = inputset.Get("LayoutID");

                        DeleteReportLayout(layoutID);

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

        internal static List<ReportLayoutData> GetReportLayoutByUser(string rptname, string username)
        {
            DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("SOHDB"), CommandType.Text,
                            $@"select [Id],[LayoutName],[LayoutContent],isnull(b.[IsDefault],0) as [IsDefault], [Username], [SharePublic] from
                                (
                                SELECT [Id],[LayoutName],[LayoutContent],isnull([IsDefault],0) as [IsDefault], [Username], isnull([SharePublic], 0) as [SharePublic] FROM [dbo].[SAPReportLayout]
                                    WHERE ReportName='{rptname}' and Username='{username}' union 
                                SELECT [Id],[LayoutName],[LayoutContent],isnull([IsDefault],0) as [IsDefault], [Username], isnull([SharePublic], 0) as [SharePublic] FROM [dbo].[SAPReportLayout]
                                    WHERE ReportName='{rptname}' and SharePublic=1) a
                                left join
                                (SELECT [ReportLayoutId], convert(bit, 'true') as [IsDefault]
                                    FROM [SOH_Portal].[dbo].[SAPReportLayoutUsrDef] where Username='{username}') b
                                    on a.Id=b.ReportLayoutId
                                ");

            List<ReportLayoutData> list = new List<ReportLayoutData>();
            list.Add(new ReportLayoutData() { Id = "000000000", LayoutName = "Original", LayoutContent = "" });

            for (int r = 0; r < rcd.Tables[0].Rows.Count; r++)
            {
                var row = rcd.Tables[0].Rows[r];

                ReportLayoutData item = new ReportLayoutData();
                item.Id = row["Id"].ToString().Trim();
                item.LayoutName = row["LayoutName"].ToString().Trim();
                item.LayoutContent = row["LayoutContent"].ToString().Trim();
                item.IsDefault = bool.Parse(row["IsDefault"].ToString());
                item.UserName = row["Username"].ToString().Trim();
                item.IsPublic = bool.Parse(row["SharePublic"].ToString());
                list.Add(item);
            }

            return list;
        }

        internal static ReportLayoutObj GetReportObjDefault(string rptname, string username)
        {
            var list = GetReportLayoutByUser(rptname, username);
            if(list.Count > 0)
            {
                ReportLayoutData d = null;
                if (list.Count == 1)
                    d = list[0];
                else
                    d = list.FirstOrDefault(t => t.IsDefault == true);

                if (d == null) d = list[0];

                var reportObj = JsonConvert.DeserializeObject<ReportLayoutObj>(d.LayoutContent);
                return reportObj;
            }

            return null;            
        }

        private string CreateNewReportLayout(string rptname, string username, string layoutname, string layoutcontent)
        {
            List<SqlParameter> paras = new List<SqlParameter>();
            paras.Add(new SqlParameter("@reportName", rptname));
            paras.Add(new SqlParameter("@userName", username));
            paras.Add(new SqlParameter("@layoutName", layoutname));
            paras.Add(new SqlParameter("@layoutContent", layoutcontent));
            DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("SOHDB"), CommandType.StoredProcedure, "p_InsSAPReportLayout", paras.ToArray());

            var row = rcd.Tables[0].Rows[0];

            string id = row["LayoutID"].ToString();

            return id;
        }

        private void UpdateReportLayout(string id, string layoutname, string layoutcontent)
        {
            List<SqlParameter> paras = new List<SqlParameter>();
            paras.Add(new SqlParameter("@layoutID", id));
            paras.Add(new SqlParameter("@layoutName", layoutname));
            paras.Add(new SqlParameter("@layoutContent", layoutcontent));
            SqlHelper.ExecuteNonQuery(SqlHelper.GetConnection("SOHDB"), CommandType.StoredProcedure, "p_UpdateSAPReportLayout", paras.ToArray());
        }

        private void UpdateReportLayoutDefault(string id, string username)
        {
            List<SqlParameter> paras = new List<SqlParameter>();
            paras.Add(new SqlParameter("@layoutID", id));
            paras.Add(new SqlParameter("@username", username));
            SqlHelper.ExecuteNonQuery(SqlHelper.GetConnection("SOHDB"), CommandType.StoredProcedure, "p_UpdateSAPReportLayoutDefault", paras.ToArray());
        }

        private void UpdateReportLayoutPublic(string id, bool setPublic)
        {
            List<SqlParameter> paras = new List<SqlParameter>();
            paras.Add(new SqlParameter("@layoutID", id));
            paras.Add(new SqlParameter("@public", setPublic));
            SqlHelper.ExecuteNonQuery(SqlHelper.GetConnection("SOHDB"), CommandType.StoredProcedure, "p_UpdateSAPReportLayoutPublic", paras.ToArray());
        }

        private void DeleteReportLayout(string id)
        {
            List<SqlParameter> paras = new List<SqlParameter>();
            paras.Add(new SqlParameter("@layoutID", id));
            SqlHelper.ExecuteNonQuery(SqlHelper.GetConnection("SOHDB"), CommandType.StoredProcedure, "p_DeleteSAPReportLayout", paras.ToArray());
        }

        internal class ReportFileData
        {
            public string FileName;
            public string FileDataBase64;
        }

        internal class ReportLayoutData
        {
            public string Id;
            public string LayoutName;
            public string LayoutContent;
            public bool IsDefault;
            public string UserName;
            public bool IsPublic;
        }

        internal class ReportLayoutObj
        {
            public List<ReportLayoutColumn> columns { get; set; }
            public bool groupable { get; set; }
        }

        internal class ReportLayoutColumn
        {
            public bool encoded { get; set; }
            public string field { get; set; }
            public string title { get; set; }
            public string width { get; set; }
            public string template { get; set; }
            public bool locked { get; set; }
            public bool? hidden { get; set; }
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