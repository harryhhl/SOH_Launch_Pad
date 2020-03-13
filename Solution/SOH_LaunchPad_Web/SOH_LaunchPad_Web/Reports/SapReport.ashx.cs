using Helper;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Net.Http;
using System.Web;
using System.Web.Hosting;

namespace SOH_LaunchPad_Web
{
    /// <summary>
    /// Summary description for SapReport
    /// </summary>
    public class SapReport : IHttpHandler
    {
        private static readonly string AuthWSEndpointUrl = ConfigurationManager.AppSettings["SOH.AuthWS.EndpointUrl"];
        private static readonly string SapReportWSEndpointUrl = ConfigurationManager.AppSettings["SOH.SapReportWS.EndpointUrl"];

        public async void ProcessRequest(HttpContext context)
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
                var reportname = inputset.Get("Report");

                if (action == "new")
                {
                    var requestforQID = await GenericRequest.Post(SapReportWSEndpointUrl + "AddReportQueue.ashx", new StringContent(input));

                    if(requestforQID.Status == RequestResult.ResultStatus.Failure)
                    {
                        context.Response.StatusCode = 500;
                        context.Response.StatusDescription = requestforQID.Errmsg;
                        return;
                    }

                    string qid = requestforQID.Data;

                    CallReport(qid, token, sysfuncid);
                    context.Response.ContentType = "application/json";
                    context.Response.Write(JsonConvert.SerializeObject(requestforQID));
                }
                else if(action == "getqueue")
                {
                    var result = await GenericRequest.Post(SapReportWSEndpointUrl + "GetReportQueue.ashx", new StringContent(input));
                    if(result.Status == RequestResult.ResultStatus.Failure)
                    {
                        context.Response.StatusCode = 400;
                        context.Response.StatusDescription = result.GetErrmsgTrim();
                    }
                    else
                    {
                        context.Response.ContentType = "application/json";
                        context.Response.Write(result.Data);
                    }
                }
                else if (action == "getconfig")
                {
                    var result = await GenericRequest.Post(SapReportWSEndpointUrl + "GetReportConfig.ashx", new StringContent(input));
                    if (result.Status == RequestResult.ResultStatus.Failure)
                    {
                        context.Response.StatusCode = 400;
                        context.Response.StatusDescription = result.GetErrmsgTrim();
                    }
                    else
                    {
                        context.Response.ContentType = "application/json";
                        context.Response.Write(result.Data);
                    }
                }
                else if (action == "getalvschema")
                {
                    var result = await GenericRequest.Post(SapReportWSEndpointUrl + "GetALVReportSchema.ashx", new StringContent(input));
                    if (result.Status == RequestResult.ResultStatus.Failure)
                    {
                        context.Response.StatusCode = 400;
                        context.Response.StatusDescription = result.GetErrmsgTrim();
                    }
                    else
                    {
                        context.Response.ContentType = "application/json";
                        context.Response.Write(result.Data);
                    }
                }
                else if (action == "getalvdata")
                {
                    var result = await GenericRequest.Post(SapReportWSEndpointUrl + "GetALVReportData.ashx", new StringContent(input));
                    if (result.Status == RequestResult.ResultStatus.Failure)
                    {
                        context.Response.StatusCode = 400;
                        context.Response.StatusDescription = result.GetErrmsgTrim();
                    }
                    else
                    {
                        context.Response.ContentType = "application/json";
                        context.Response.Write(result.Data);
                    }
                }
                else if (action == "getfiledata")
                {
                    var result = await GenericRequest.Post(SapReportWSEndpointUrl + "GetFileReportData.ashx", new StringContent(input));
                    if (result.Status == RequestResult.ResultStatus.Failure)
                    {
                        context.Response.StatusCode = 400;
                        context.Response.StatusDescription = result.GetErrmsgTrim();
                    }
                    else
                    {
                        context.Response.ContentType = "application/json";
                        context.Response.Write(result.Data);
                    }
                }
                else if (action == "getmasterdata")
                {
                    var result = await GenericRequest.Post(SapReportWSEndpointUrl + "GetReportMaster.ashx", new StringContent(input));
                    if (result.Status == RequestResult.ResultStatus.Failure)
                    {
                        context.Response.StatusCode = 400;
                        context.Response.StatusDescription = result.GetErrmsgTrim();
                    }
                    else
                    {
                        context.Response.ContentType = "application/json";
                        context.Response.Write(result.Data);
                    }
                }
                else if(action == "getrptlayout")
                {
                    try
                    {
                        var username = inputset.Get("User");
                        var layoutlist = GetReportLayoutByUser(reportname, username);

                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(layoutlist));
                    }
                    catch(Exception ex)
                    {
                        context.Response.StatusCode = 400;
                        context.Response.StatusDescription = $@"Error: {ex.Message}";
                    }

                }
                else if (action == "newrptlayout")
                {
                    try
                    {
                        var username = inputset.Get("User");
                        var layoutname = inputset.Get("LayoutName");
                        var layoutcontent = inputset.Get("LayoutContent");

                        var layoutId = CreateNewReportLayout(reportname, username, layoutname, layoutcontent);

                        List<ReportLayoutData> list = new List<ReportLayoutData>();
                        list.Add(new ReportLayoutData() { Id = layoutId, LayoutName = layoutname, LayoutContent = layoutcontent });

                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(list));
                    }
                    catch (Exception ex)
                    {
                        context.Response.StatusCode = 400;
                        context.Response.StatusDescription = $@"Error: {ex.Message}";
                    }
                }
                else if (action == "updrptlayout")
                {
                    try
                    {
                        var layoutID = inputset.Get("LayoutID");
                        var layoutname = inputset.Get("LayoutName");
                        var layoutcontent = inputset.Get("LayoutContent");

                        UpdateReportLayout(layoutID, layoutname, layoutcontent);

                        context.Response.ContentType = "application/json";
                        context.Response.Write("{}");
                    }
                    catch (Exception ex)
                    {
                        context.Response.StatusCode = 400;
                        context.Response.StatusDescription = $@"Error: {ex.Message}";
                    }
                }
                else if (action == "updrptlayoutdefault")
                {
                    try
                    {
                        var layoutID = inputset.Get("LayoutID");

                        UpdateReportLayoutDefault(layoutID);

                        context.Response.ContentType = "application/json";
                        context.Response.Write("{}");
                    }
                    catch (Exception ex)
                    {
                        context.Response.StatusCode = 400;
                        context.Response.StatusDescription = $@"Error: {ex.Message}";
                    }
                }
                else
                {
                    context.Response.StatusCode = 400;
                    context.Response.StatusDescription = "No Action is defined";
                }
            }
            else
            {
                context.Response.StatusCode = 405;
                context.Response.StatusDescription = "Sorry, only POST method allowed";
            }
        }

        private void CallReport(string qid, string token, string sysfuncid)
        {
            HostingEnvironment.QueueBackgroundWorkItem(async cancellationToken =>
            {
                string uri = "CallReport.ashx";

                Dictionary<string, string> jsonValues = new Dictionary<string, string>();
                jsonValues.Add("Token", token);
                jsonValues.Add("ReportQueueId", qid);
                jsonValues.Add("FuncID", sysfuncid);
                using (var content = new FormUrlEncodedContent(jsonValues))
                {
                    var ret = await GenericRequest.Post(SapReportWSEndpointUrl + uri, content);
                }
            });            
        }

        private List<ReportLayoutData> GetReportLayoutByUser(string rptname, string username)
        {
            DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("SOHDB"), CommandType.Text,
                            $@"SELECT [Id],[LayoutName],[LayoutContent],isnull([IsDefault],0) as [IsDefault] FROM [dbo].[SAPReportLayout]
                                WHERE ReportName='{rptname}' and Username='{username}';");

            List<ReportLayoutData> list = new List<ReportLayoutData>();
            list.Add(new ReportLayoutData() { Id = Guid.NewGuid().ToString(), LayoutName = "Default", LayoutContent = "" });

            for (int r = 0; r < rcd.Tables[0].Rows.Count; r++)
            {
                var row = rcd.Tables[0].Rows[r];

                ReportLayoutData item = new ReportLayoutData();
                item.Id = row["Id"].ToString().Trim();
                item.LayoutName = row["LayoutName"].ToString().Trim();
                item.LayoutContent = row["LayoutContent"].ToString().Trim();
                item.IsDefault = bool.Parse(row["IsDefault"].ToString());

                list.Add(item);
            }

            return list;
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

        private void UpdateReportLayoutDefault(string id)
        {
            List<SqlParameter> paras = new List<SqlParameter>();
            paras.Add(new SqlParameter("@layoutID", id));
            SqlHelper.ExecuteNonQuery(SqlHelper.GetConnection("SOHDB"), CommandType.StoredProcedure, "p_UpdateSAPReportLayoutDefault", paras.ToArray());
        }

        public class ReportFileData
        {
            public string FileName;
            public string FileDataBase64;
        }

        public class ReportLayoutData
        {
            public string Id;
            public string LayoutName;
            public string LayoutContent;
            public bool IsDefault;
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