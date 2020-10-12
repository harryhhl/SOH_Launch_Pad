using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Web.SessionState;

namespace SOH_LaunchPad_Web.Approval.PO
{
    /// <summary>
    /// Summary description for PO
    /// </summary>
    public class PO : HttpTaskAsyncHandler, IRequiresSessionState
    {
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
                        await Common.APILogging(input, context);
                    }

                    var inputset = HttpUtility.ParseQueryString(input);
                    var action = inputset.Get("Action");
                    var token = inputset.Get("Token");
                    var sysfuncid = inputset.Get("FuncID");

                    if (action == "list")
                    {
                        var result = await GenericRequest.Post(Common.ApprovalWSEndpointUrl + "po/list.ashx", new StringContent(input));
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
                        var result = await GenericRequest.Post(Common.ApprovalWSEndpointUrl + "po/approve.ashx", new StringContent(input));
                        if (result.Status == RequestResult.ResultStatus.Failure)
                        {
                            context.Response.StatusCode = 400;
                            context.Response.StatusDescription = result.GetErrmsgTrim();
                        }
                        else
                        {
                            input = input.Replace("Action=approve", "Action=approvesuccess");
                            input += $@"&retdata={result.Data}";
                            await Common.APILogging(input, context);
                            context.Response.ContentType = "application/json";
                            context.Response.Write(result.Data);
                        }
                    }
                    else if (action == "printpreview")
                    {
                        var po = inputset.Get("PONo");
                        string guid = Guid.NewGuid().ToString();
                        string sid = HttpContext.Current.Session["POApprovalDetail_PO_" + po] as string;

                        if (string.IsNullOrEmpty(sid))
                        {
                            input = input.Replace("xxguidxx", guid);
                            var result = await GenericRequest.Post(Common.ApprovalWSEndpointUrl + "po/printpreview.ashx", new StringContent(input));
                            if (result.Status == RequestResult.ResultStatus.Failure)
                            {
                                context.Response.StatusCode = 400;
                                context.Response.StatusDescription = result.GetErrmsgTrim();
                                return;
                            }

                            Dictionary<string, string> jsonValues2 = new Dictionary<string, string>();
                            jsonValues2.Add("Token", token);
                            jsonValues2.Add("QID", guid);
                            var requestforData = await GenericRequest.Post(Common.SapReportWSEndpointUrl + "GetFileReportData.ashx", new FormUrlEncodedContent(jsonValues2));
                            if (requestforData.Status == RequestResult.ResultStatus.Failure)
                            {
                                context.Response.StatusCode = 400;
                                context.Response.StatusDescription = requestforData.GetErrmsgTrim();
                                return;
                            }

                            sid = Guid.NewGuid().ToString();

                            HttpContext.Current.Session["POApprovalDetail_" + sid] = requestforData.Data;
                            HttpContext.Current.Session["POApprovalDetail_PO_" + po] = sid;
                        }

                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(sid));
                    }
                    else if (action == "getaappr")
                    {

                        var result = await GenericRequest.Post(Common.ApprovalWSEndpointUrl + "/getaapr.ashx", new StringContent(input));
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