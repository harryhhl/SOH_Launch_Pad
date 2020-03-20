using Helper;
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
        private static readonly string AuthWSEndpointUrl = ConfigurationManager.AppSettings["SOH.AuthWS.EndpointUrl"];

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

        public static void SetFuncPreference(string username, string sysfuncid, string key, string value)
        {
            List<SqlParameter> paras = new List<SqlParameter>();
            paras.Add(new SqlParameter("@Username", username));
            paras.Add(new SqlParameter("@SystemFuncID", sysfuncid));
            paras.Add(new SqlParameter("@PreKey", key));
            paras.Add(new SqlParameter("@PreVal", value));
            SqlHelper.ExecuteNonQuery(SqlHelper.GetConnection("SOHDB"), CommandType.StoredProcedure, "p_SetPreference", paras.ToArray());
        }

        public static Dictionary<string, object> GetFuncPreference(string username, string sysfuncid)
        {
            Dictionary<string, object> result = new Dictionary<string, object>();

            List<SqlParameter> paras = new List<SqlParameter>();
            paras.Add(new SqlParameter("@Username", username));
            paras.Add(new SqlParameter("@SystemFuncID", sysfuncid));
            DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("SOHDB"), CommandType.StoredProcedure, "p_GetPreference", paras.ToArray());

            for (int r = 0; r < rcd.Tables[0].Rows.Count; r++)
            {
                var row = rcd.Tables[0].Rows[r];
                result.Add(row["PreKey"].ToString(), row["PreVal"]);
            }

            return result;
        }

        public static string WildCardToRegular(string value)
        {
            return "^" + Regex.Escape(value).Replace("\\?", ".").Replace("\\*", ".*") + "$";
        }
    }
}