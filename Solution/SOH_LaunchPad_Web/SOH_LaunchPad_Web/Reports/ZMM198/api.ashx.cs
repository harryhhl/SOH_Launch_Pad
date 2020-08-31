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

                    CallReport(qid, token, sysfuncid, qid_data, "2");
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