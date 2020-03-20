using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Web.Hosting;

namespace SOH_LaunchPad_Web
{
    /// <summary>
    /// Summary description for POApproval
    /// </summary>
    public class POApproval : HttpTaskAsyncHandler
    {
        private static readonly string AuthWSEndpointUrl = ConfigurationManager.AppSettings["SOH.AuthWS.EndpointUrl"];
        private static readonly string ApprovalWSEndpointUrl = ConfigurationManager.AppSettings["SOH.Approval.EndpointUrl"];

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

                    var action = HttpUtility.ParseQueryString(input).Get("Action");
                    var token = HttpUtility.ParseQueryString(input).Get("Token");
                    var sysfuncid = HttpUtility.ParseQueryString(input).Get("FuncID");
                    var reportname = HttpUtility.ParseQueryString(input).Get("Report");
                    var data = HttpUtility.ParseQueryString(input).Get("Data");
                    var username = HttpUtility.ParseQueryString(input).Get("User");

                    string userid = await GetUserLANID(token, sysfuncid);
                    userid = "SPOA01";
                    input = input + "&name="+userid;

                    if (action == "list")
                    {
                        var result = await GenericRequest.Post(ApprovalWSEndpointUrl + "list.aspx", new StringContent(input));
                        if (result.Status == RequestResult.ResultStatus.Failure)
                        {
                            context.Response.StatusCode = 400;
                            context.Response.StatusDescription = result.GetErrmsgTrim();
                        }
                        else
                        {
                            var releaseCodeStr = HttpUtility.ParseQueryString(input).Get("releaseCode");
                            Common.SetFuncPreference(username, sysfuncid, "releaseCode", releaseCodeStr);

                            context.Response.ContentType = "application/json";
                            context.Response.Write(result.Data);
                        }
                    }
                    else if (action == "release")
                    {
                        var result = await GenericRequest.Post(ApprovalWSEndpointUrl + "release.aspx", new StringContent(input));
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
                    else if (action == "unrelease")
                    {
                        var result = await GenericRequest.Post(ApprovalWSEndpointUrl + "unrelease.aspx", new StringContent(input));
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
                        var userPref = Common.GetFuncPreference(username, sysfuncid);
                        foreach(KeyValuePair<string, object> tmp in userPref)
                        {
                            input = input + $"&{tmp.Key}={tmp.Value.ToString()}";
                        }

                        var result = await GenericRequest.Post(ApprovalWSEndpointUrl + "list-count.aspx", new StringContent(input));
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
                    else if (action == "master")
                    {
                        var result = await GenericRequest.Post(ApprovalWSEndpointUrl + "master-data.aspx", new StringContent(input));
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
                    else if (action == "getPref")
                    {
                        var result = Common.GetFuncPreference(username, sysfuncid);
                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(result));
                    }
                    else
                    {
                        context.Response.StatusCode = 400;
                        context.Response.StatusDescription = "No Action is defined";
                    }
                }
                catch(Exception ex)
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

        private async Task<string> GetUserLANID(string token, string sysfuncid)
        {
            RequestResult result = await Common.RequestUser(token, sysfuncid);
            if (result.Status == RequestResult.ResultStatus.Failure)
                throw new Exception(result.Errmsg);

            var tmp = JsonConvert.DeserializeObject<Dictionary<string, string>>(result.Data);
            string userid = tmp["LAN_ID"];

            return userid;
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