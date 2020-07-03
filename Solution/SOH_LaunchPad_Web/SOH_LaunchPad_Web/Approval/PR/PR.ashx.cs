using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Web.SessionState;

namespace SOH_LaunchPad_Web.Approval.PR
{
    /// <summary>
    /// Summary description for PR
    /// </summary>
    public class PR : HttpTaskAsyncHandler, IRequiresSessionState
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
                        var result = await GenericRequest.Post(Common.ApprovalWSEndpointUrl + "pr/list.ashx", new StringContent(input));
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
                        var result = await GenericRequest.Post(Common.ApprovalWSEndpointUrl + "pr/approve.ashx", new StringContent(input));
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