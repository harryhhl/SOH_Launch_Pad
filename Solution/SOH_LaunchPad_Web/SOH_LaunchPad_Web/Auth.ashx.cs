using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using System.Configuration;

namespace SOH_LaunchPad_Web
{
    /// <summary>
    /// Summary description for Auth
    /// </summary>
    public class Auth : HttpTaskAsyncHandler
    {
        private static readonly string AuthWSEndpointUrl = ConfigurationManager.AppSettings["SOH.AuthWS.EndpointUrl"];

        public override async Task ProcessRequestAsync(HttpContext context)
        {
            if (HttpContext.Current.Request.HttpMethod == "POST")
            {
                string input;
                using (StreamReader reader = new StreamReader(context.Request.InputStream))
                {
                    input = reader.ReadToEnd();
                }

                var action = HttpUtility.ParseQueryString(input).Get("Action");

                if (action == "login")
                {
                    string useragent = $@"{HttpContext.Current.Request.UserHostAddress};{HttpContext.Current.Request.UserAgent}";
                    string authResult = await RequestAuth(input + "&UserAgent=" + useragent);

                    context.Response.ContentType = "application/json";
                    context.Response.Write(authResult);
                }
                else if(action == "getfuncmenu")
                {
                    string result = await RequestFuncMenu(input);

                    context.Response.ContentType = "application/json";
                    context.Response.Write(result);
                }
            }
            else
            {
                context.Response.StatusCode = 405;
                context.Response.StatusDescription = "Sorry, only POST method allowed";
            }
        }

        private async Task<string> RequestAuth(string request)
        {
            HttpClient client = new HttpClient();
            HttpResponseMessage response;
            string uri = "GetAuth.ashx";

            using (var content = new StringContent(request))
            {
                content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                response = await client.PostAsync(AuthWSEndpointUrl + uri, content);
                
                string result = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    return result;
                }
                else
                {
                    return result;
                }
            }
        }

        private async Task<string> RequestFuncMenu(string request)
        {
            HttpClient client = new HttpClient();
            HttpResponseMessage response;
            string uri = "GetFuncMenu.ashx";

            using (var content = new StringContent(request))
            {
                content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                response = await client.PostAsync(AuthWSEndpointUrl + uri, content);
                string result = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    return result;
                }
                else
                {
                    return result;
                }
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