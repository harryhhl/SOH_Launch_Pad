using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Web.SessionState;
using Newtonsoft.Json;

namespace SOH_LaunchPad_Web.Approval.SOApproval
{
    /// <summary>
    /// Summary description for SOApproval
    /// </summary>
    public class SOApproval : HttpTaskAsyncHandler, IRequiresSessionState
    {
        private static readonly string AuthWSEndpointUrl = ConfigurationManager.AppSettings["SOH.AuthWS.EndpointUrl"];
        private static readonly string ApprovalWSEndpointUrl = ConfigurationManager.AppSettings["SOH.Approval.EndpointUrl"];
        private static readonly string SapReportWSEndpointUrl = ConfigurationManager.AppSettings["SOH.SapReportWS.EndpointUrl"];

        public override async Task ProcessRequestAsync(HttpContext context)
        {
            if (HttpContext.Current.Request.HttpMethod == "POST")
            {
                try
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

                    if (action == "list")
                    {
                        var result = await GenericRequest.Post(ApprovalWSEndpointUrl + "soapproval/list.ashx", new StringContent(input));
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
                    else if (action == "approve")
                    {
                        var result = await GenericRequest.Post(ApprovalWSEndpointUrl + "soapproval/approve.ashx", new StringContent(input));
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
                    else if (action == "pendingcount")
                    {

                        var result = await GenericRequest.Post(ApprovalWSEndpointUrl + "soapproval/listcount.ashx", new StringContent(input));
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
                    else if (action == "getaappr")
                    {

                        var result = await GenericRequest.Post(ApprovalWSEndpointUrl + "/getaapr.ashx", new StringContent(input));
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
                    else if (action == "viewdetail")
                    {
                        var so = inputset.Get("SO");
                        string sid = HttpContext.Current.Session["SOApprovalDetail_SO_" + so] as string;

                        if (string.IsNullOrEmpty(sid))
                        {
                            input = input.Replace("viewdetail", "new");
                            var requestforQID = await GenericRequest.Post(SapReportWSEndpointUrl + "AddReportQueue.ashx", new StringContent(input));
                            if (requestforQID.Status == RequestResult.ResultStatus.Failure)
                            {
                                context.Response.StatusCode = 400;
                                context.Response.StatusDescription = requestforQID.Errmsg;
                                return;
                            }


                            Dictionary<string, string> jsonValues = new Dictionary<string, string>();
                            jsonValues.Add("Token", token);
                            jsonValues.Add("ReportQueueId", requestforQID.Data);
                            jsonValues.Add("FuncID", sysfuncid);
                            var requestforReport = await GenericRequest.Post(SapReportWSEndpointUrl + "CallReport.ashx", new FormUrlEncodedContent(jsonValues));
                            if (requestforReport.Status == RequestResult.ResultStatus.Failure)
                            {
                                context.Response.StatusCode = 400;
                                context.Response.StatusDescription = requestforReport.Errmsg;
                                return;
                            }


                            Dictionary<string, string> jsonValues2 = new Dictionary<string, string>();
                            jsonValues2.Add("Token", token);
                            jsonValues2.Add("QID", requestforQID.Data);
                            var requestforData = await GenericRequest.Post(SapReportWSEndpointUrl + "GetFileReportData.ashx", new FormUrlEncodedContent(jsonValues2));
                            if (requestforData.Status == RequestResult.ResultStatus.Failure)
                            {
                                context.Response.StatusCode = 400;
                                context.Response.StatusDescription = requestforData.GetErrmsgTrim();
                                return;
                            }

                            sid = Guid.NewGuid().ToString();

                            HttpContext.Current.Session["SOApprovalDetail_" + sid] = requestforData.Data;
                            HttpContext.Current.Session["SOApprovalDetail_SO_" + so] = sid;
                        }

                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(sid));
                    }
                    else
                    {
                        context.Response.StatusCode = 400;
                        context.Response.StatusDescription = "No Action is defined";
                    }
                }
                catch (Exception ex)
                {
                    context.Response.StatusCode = 500;
                    context.Response.StatusDescription = ex.Message.Substring(0, Math.Min(ex.Message.Length, 511));
                }
            }
            else
            {
                context.Response.StatusCode = 405;
                context.Response.StatusDescription = "Sorry, only POST method allowed";
            }
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