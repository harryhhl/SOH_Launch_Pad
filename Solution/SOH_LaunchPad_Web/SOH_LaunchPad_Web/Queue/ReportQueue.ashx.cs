﻿using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Net.Http;
using System.Web;
using System.Web.Hosting;

namespace SOH_LaunchPad_Web.Queue
{
    /// <summary>
    /// Summary description for ReportQueue
    /// </summary>
    public class ReportQueue : IHttpHandler
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

                if (action == "getqueue")
                {
                    var result = await GenericRequest.Post(SapReportWSEndpointUrl + "GetReportQueue.ashx", new StringContent(input));
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

        public bool IsReusable
        {
            get
            {
                return false;
            }
        }
    }
}