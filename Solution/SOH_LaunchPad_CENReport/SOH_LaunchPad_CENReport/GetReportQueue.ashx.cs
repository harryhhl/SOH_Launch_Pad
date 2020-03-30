using System;
using System.Collections.Generic;
using System.Web;
using Newtonsoft.Json;
using System.IO;
using System.Data;
using Helper;


namespace SOH_LaunchPad_CENReport
{
    /// <summary>
    /// Summary description for GetReportQueue
    /// </summary>
    public class GetReportQueue : IHttpHandler
    {
        public async void ProcessRequest(HttpContext context)
        {
            if (HttpContext.Current.Request.HttpMethod == "POST")
            {
                string input;
                using (StreamReader reader = new StreamReader(context.Request.InputStream))
                {
                    input = reader.ReadToEnd();
                }
                var token = HttpUtility.ParseQueryString(input).Get("Token");
                var sysfuncid = HttpUtility.ParseQueryString(input).Get("FuncID");
                var reportname = HttpUtility.ParseQueryString(input).Get("Report");
                var queueid = HttpUtility.ParseQueryString(input).Get("qid");
                //var data = HttpUtility.ParseQueryString(input).Get("Data");

                try
                {
                    RequestResult result = await Common.RequestUsername(token, sysfuncid);
                    if (result.Status == RequestResult.ResultStatus.Failure)
                        throw new Exception(result.Errmsg);

                    var tmp = JsonConvert.DeserializeObject<Dictionary<string, string>>(result.Data);
                    string username = tmp["Username"];

                    string query = "";
                    if (queueid != null && queueid.Length > 1)
                    {
                        query = $@"SELECT top 1 [Id],a.[ReportName], isnull(b.[ReportDisplayName], a.[ReportName]) as [ReportDisplayName],
                                        [CreateDate],[Status],[UpdateDate],[LogMessage],[OutputType]
                                   FROM [dbo].[SAPReportQueue] a
                                   left join [dbo].SAPReportList b on a.ReportName=b.ReportName
                                   where a.Id = '{queueid}'";
                    }
                    else if (reportname != null && reportname.Length > 1)
                    {
                        query = $@"SELECT [Id],a.[ReportName], isnull(b.[ReportDisplayName], a.[ReportName]) as [ReportDisplayName],
                                        [CreateDate],[Status],[UpdateDate],[LogMessage],[OutputType]
                                   FROM [dbo].[SAPReportQueue] a
                                   left join [dbo].SAPReportList b on a.ReportName=b.ReportName
                                   where a.ReportName = '{reportname}' and Username = '{username}' order by CreateDate desc";
                    }
                    else
                    {
                        query = $@"SELECT [Id],a.[ReportName], isnull(b.[ReportDisplayName], a.[ReportName]) as [ReportDisplayName],
                                        [CreateDate],[Status],[UpdateDate],[LogMessage],[OutputType]
                                   FROM [dbo].[SAPReportQueue] a
                                   left join [dbo].SAPReportList b on a.ReportName=b.ReportName
                                   where Username = '{username}' and Hidden=0 order by CreateDate desc";
                    }

                    DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("SOHDB"), CommandType.Text, query);

                    ReportQueueList list = new ReportQueueList();
                    for (int r = 0; r < rcd.Tables[0].Rows.Count; r++)
                    {
                        var row = rcd.Tables[0].Rows[r];

                        ReportQueue item = new ReportQueue();
                        item.Id = row["Id"].ToString();
                        item.ReportName = row["ReportName"].ToString();
                        item.ReportDisplayName = row["ReportDisplayName"].ToString();
                        item.CreateDate = (DateTime)row["CreateDate"];
                        item.UpdateDate = (DateTime)row["UpdateDate"];
                        item.Status = (int)row["Status"];
                        item.LogMessage = row["LogMessage"].ToString();
                        item.OutputType = row["OutputType"].ToString();

                        list.ListData.Add(item);
                    }


                    RequestResult ret = new RequestResult(RequestResult.ResultStatus.Success);
                    ret.Data = JsonConvert.SerializeObject(list);
                    context.Response.ContentType = "application/json";
                    context.Response.Write(JsonConvert.SerializeObject(ret));
                }
                catch (Exception ex)
                {
                    RequestResult result = new RequestResult(RequestResult.ResultStatus.Failure);
                    result.Errmsg = ex.Message;
                    context.Response.ContentType = "application/json";
                    context.Response.Write(JsonConvert.SerializeObject(result));
                }

                context.Response.StatusCode = 200;
                context.Response.StatusDescription = "OK";
            }
            else
            {
                context.Response.StatusCode = 405;
                context.Response.StatusDescription = "Sorry, only POST method allowed";
            }
        }

        private class ReportQueueList
        {
            public List<ReportQueue> ListData = new List<ReportQueue>();
            public int TotalCount
            {
                get
                {
                    return ListData.Count;
                }
            }
        }

        private class ReportQueue
        {
            public string Id;
            public string ReportName;
            public string ReportDisplayName;
            public DateTime CreateDate;
            public DateTime UpdateDate;
            public int Status;

            public string StatusText
            {
                get
                {
                    switch (Status)
                    {
                        case 0:
                            return "Pending";
                        case 1:
                            return "Success";
                        case 2:
                            return "Information";
                        default:
                            return "Failed";
                    }

                }

            }

            public string LogMessage;
            public string OutputType;
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