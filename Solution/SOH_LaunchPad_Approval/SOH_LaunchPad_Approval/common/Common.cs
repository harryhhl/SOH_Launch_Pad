using Helper;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;

namespace SOH_LaunchPad_Approval.common
{
    public class Common
    {
        private static readonly string AuthWSEndpointUrl = ConfigurationManager.AppSettings["SOH.AuthWS.EndpointUrl"];

        public static async Task<RequestResult> RequestUsername(string token, string sysfuncid)
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

        public static Dictionary<string, string> GetSysSettings()
        {
            Dictionary<string, string> settings = new Dictionary<string, string>();

            List<SqlParameter> paras = new List<SqlParameter>();
            DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("SOHDB"), CommandType.StoredProcedure, "p_GetSOHSettings", paras.ToArray());
            for (int r = 0; r < rcd.Tables[0].Rows.Count; r++)
            {
                var row = rcd.Tables[0].Rows[r];

                string name = row["Name"].ToString();
                string value = row["Value"].ToString();

                settings.Add(name, value);
            }

            return settings;
        }
    }
}