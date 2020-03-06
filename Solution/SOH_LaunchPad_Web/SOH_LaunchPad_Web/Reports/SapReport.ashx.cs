using Newtonsoft.Json;
using System.Collections.Generic;
using System.Configuration;
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

                var action = HttpUtility.ParseQueryString(input).Get("Action");
                var token = HttpUtility.ParseQueryString(input).Get("Token");
                var sysfuncid = HttpUtility.ParseQueryString(input).Get("FuncID");
                var reportname = HttpUtility.ParseQueryString(input).Get("Report");
                var data = HttpUtility.ParseQueryString(input).Get("Data");

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

        public class ReportFileData
        {
            public string FileName;
            public string FileDataBase64;
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