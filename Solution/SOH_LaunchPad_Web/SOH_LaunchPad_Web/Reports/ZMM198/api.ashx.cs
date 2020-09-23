using KendoHelper;
using Newtonsoft.Json;
using NPOI.SS.UserModel;
using NPOI.XSSF.UserModel;
using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web;
using System.Web.Hosting;
using System.Web.SessionState;

namespace SOH_LaunchPad_Web
{
    /// <summary>
    /// Summary description for SapReport
    /// </summary>
    public class ZMM198_API : HttpTaskAsyncHandler, IRequiresSessionState
    {
        public override async Task ProcessRequestAsync(HttpContext context)
        {
            if (HttpContext.Current.Request.HttpMethod == "POST")
            {
                string input;
                using (StreamReader reader = new StreamReader(context.Request.InputStream))
                {
                    input = reader.ReadToEnd();
                    await Common.APILogging(input, context);
                }

                var inputset = HttpUtility.ParseQueryString(input);
                var action = inputset.Get("Action");
                var token = inputset.Get("Token");
                var sysfuncid = inputset.Get("FuncID");
                var reportname = inputset.Get("Report");

                if (action == "export")
                {
                    var requestforQID = await GenericRequest.Post(Common.SapReportWSEndpointUrl + "AddReportQueue.ashx", new StringContent(input));

                    if (requestforQID.Status == RequestResult.ResultStatus.Failure)
                    {
                        context.Response.StatusCode = 400;
                        context.Response.StatusDescription = requestforQID.Errmsg;
                        return;
                    }

                    string qid = requestforQID.Data;
                    string qid_data = inputset.Get("QID_data");

                    CallReport(qid, token, sysfuncid, qid_data, "1");
                    context.Response.ContentType = "application/json";
                    context.Response.Write(JsonConvert.SerializeObject(requestforQID));
                }
                else if(action == "upload")
                {
                    var upfid = inputset.Get("upfid");
                    string fdatajson = HttpContext.Current.Session["FileUpload_" + upfid] as string;
                    if (string.IsNullOrEmpty(fdatajson))
                    {
                        context.Response.StatusCode = 400;
                        context.Response.StatusDescription = "No Uploaded File Detected";
                        return;
                    }

                    ImportFileData ifd = JsonConvert.DeserializeObject<ImportFileData>(fdatajson);
                       
                    Dictionary<string, string> input_1 = new Dictionary<string, string>();
                    input_1.Add("Token", token);
                    input_1.Add("Report", reportname);
                    input_1.Add("FuncID", sysfuncid);
                    input_1.Add("Data", ifd.FileName);
                    input_1.Add("Hidden", inputset.Get("Hidden"));
                    var requestforQID = await GenericRequest.Post(Common.SapReportWSEndpointUrl + "AddReportQueue.ashx", new FormUrlEncodedContent(input_1));
                    if (requestforQID.Status == RequestResult.ResultStatus.Failure)
                    {
                        context.Response.StatusCode = 400;
                        context.Response.StatusDescription = requestforQID.Errmsg;
                        return;
                    }

                    string qid = requestforQID.Data;
                    Dictionary<string, string> jsonValues = new Dictionary<string, string>();
                    jsonValues.Add("Token", token);
                    jsonValues.Add("QID", qid);
                    jsonValues.Add("FuncID", sysfuncid);
                    jsonValues.Add("FData", fdatajson);
                    var requestforReport = await GenericRequest.Post(Common.SapReportWSEndpointUrl + "ImportFile.ashx", new FormUrlEncodedContent(jsonValues));
                    if (requestforReport.Status == RequestResult.ResultStatus.Failure)
                    {
                        context.Response.StatusCode = 400;
                        context.Response.StatusDescription = requestforReport.Errmsg;
                        return;
                    }

                    var I_TYPE = inputset.Get("I_TYPE");

                    CallReport(qid, token, sysfuncid, "", I_TYPE);
                    context.Response.ContentType = "application/json";
                    context.Response.Write(JsonConvert.SerializeObject(requestforQID));
                }
                else if (action == "getdetailschema")
                {
                    var result = await GenericRequest.Post(Common.SapReportWSEndpointUrl + "ZMM198.ashx", new StringContent(input));
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
                else if (action == "update")
                {
                    var result = await GenericRequest.Post(Common.SapReportWSEndpointUrl + "ZMM198.ashx", new StringContent(input));
                    if (result.Status == RequestResult.ResultStatus.Failure)
                    {
                        context.Response.StatusCode = 400;
                        context.Response.StatusDescription = result.GetErrmsgTrim();
                    }
                    else
                    {
                        context.Response.ContentType = "application/json";
                        context.Response.Write("{}");
                    }
                }
                else if (action == "applyupdate")
                {
                    var requestforQID = await GenericRequest.Post(Common.SapReportWSEndpointUrl + "AddReportQueue.ashx", new StringContent(input));

                    if (requestforQID.Status == RequestResult.ResultStatus.Failure)
                    {
                        context.Response.StatusCode = 400;
                        context.Response.StatusDescription = requestforQID.Errmsg;
                        return;
                    }

                    string qid = requestforQID.Data;
                    string qid_data = inputset.Get("QID_data");
                    var I_TYPE = inputset.Get("I_TYPE");

                    CallReport(qid, token, sysfuncid, qid_data, I_TYPE);
                    context.Response.ContentType = "application/json";
                    context.Response.Write(JsonConvert.SerializeObject(requestforQID));
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

        private void CallReport(string qid, string token, string sysfuncid, string qid_data, string I_TYPE)
        {
            HostingEnvironment.QueueBackgroundWorkItem(async cancellationToken =>
            {
                string uri = "CallReport.ashx";

                Dictionary<string, string> jsonValues = new Dictionary<string, string>();
                jsonValues.Add("Token", token);
                jsonValues.Add("ReportQueueId", qid);
                jsonValues.Add("FuncID", sysfuncid);
                jsonValues.Add("custrpt", "ZMM198");
                jsonValues.Add("custp1", qid_data);
                jsonValues.Add("custp2", I_TYPE);
                using (var content = new FormUrlEncodedContent(jsonValues))
                {
                    var ret = await GenericRequest.Post(Common.SapReportWSEndpointUrl + uri, content);
                }
            });            
        }

        public override bool IsReusable
        {
            get
            {
                return false;
            }
        }
    }
}