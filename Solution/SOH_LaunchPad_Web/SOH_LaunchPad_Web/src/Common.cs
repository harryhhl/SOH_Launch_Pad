using Helper;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web;

namespace SOH_LaunchPad_Web
{
    public class Common
    {
        public static readonly string AuthWSEndpointUrl = ConfigurationManager.AppSettings["SOH.AuthWS.EndpointUrl"];
        public static readonly string SapReportWSEndpointUrl = ConfigurationManager.AppSettings["SOH.SapReportWS.EndpointUrl"];
        public static readonly string ApprovalWSEndpointUrl = ConfigurationManager.AppSettings["SOH.Approval.EndpointUrl"];

        public static async Task<RequestResult> RequestUser(string token, string sysfuncid)
        {
            string uri = "CheckAuth.ashx";

            Dictionary<string, string> jsonValues = new Dictionary<string, string>();
            jsonValues.Add("Token", token);
            jsonValues.Add("SysFuncID", sysfuncid);
            using (var content = new FormUrlEncodedContent(jsonValues))
            {
                var response = await GenericRequest.Post(AuthWSEndpointUrl + uri, content);
                return response;
            }
        }

        public static async Task APILogging(string input, HttpContext context)
        {
            string handler = context.CurrentHandler == null ? "" : context.CurrentHandler.ToString();
            input += $@"&hdlr={handler}";
            await GenericRequest.Post(AuthWSEndpointUrl + "Log.ashx", new StringContent(input));
        }

        public static async Task<RequestResult> SetFuncPreference(string token, string username, string sysfuncid, string key, string value)
        {
            string uri = "Common.ashx";

            Dictionary<string, string> jsonValues = new Dictionary<string, string>();
            jsonValues.Add("Action", "setfuncpref");
            jsonValues.Add("User", username);
            jsonValues.Add("Token", token);
            jsonValues.Add("FuncID", sysfuncid);
            jsonValues.Add("Key", key);
            jsonValues.Add("Val", value);
            using (var content = new FormUrlEncodedContent(jsonValues))
            {
                var response = await GenericRequest.Post(AuthWSEndpointUrl + uri, content);
                return response;
            }
        }

        public static async Task<Dictionary<string, object>> GetFuncPreference(string token, string username, string sysfuncid)
        {
            string uri = "Common.ashx";

            Dictionary<string, string> jsonValues = new Dictionary<string, string>();
            jsonValues.Add("Action", "getfuncpref");
            jsonValues.Add("User", username);
            jsonValues.Add("Token", token);
            jsonValues.Add("FuncID", sysfuncid);
            using (var content = new FormUrlEncodedContent(jsonValues))
            {
                var response = await GenericRequest.Post(AuthWSEndpointUrl + uri, content);
                var data = JsonConvert.DeserializeObject<Dictionary<string, object>>(response.Data);
                return data;
            }
        }

        public static string WildCardToRegular(string value)
        {
            return "^" + Regex.Escape(value).Replace("\\?", ".").Replace("\\*", ".*") + "$";
        }
    }
}