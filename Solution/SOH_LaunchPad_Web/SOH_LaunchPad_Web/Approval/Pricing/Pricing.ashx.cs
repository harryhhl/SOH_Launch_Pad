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

namespace SOH_LaunchPad_Web.Approval.Pricing
{
    /// <summary>
    /// Summary description for Pricing
    /// </summary>
    public class Pricing : HttpTaskAsyncHandler, IRequiresSessionState
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
                        var result = await GenericRequest.Post(Common.ApprovalWSEndpointUrl + "pricing/list.ashx", new StringContent(input));
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
                        var result = await GenericRequest.Post(Common.ApprovalWSEndpointUrl + "pricing/approve.ashx", new StringContent(input));
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

                        var result = await GenericRequest.Post(Common.ApprovalWSEndpointUrl + "pricing/listcount.ashx", new StringContent(input));
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
                    else if (action == "viewdetail")
                    {
                        var result = await GenericRequest.Post(Common.ApprovalWSEndpointUrl + "pricing/detail.ashx", new StringContent(input));
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