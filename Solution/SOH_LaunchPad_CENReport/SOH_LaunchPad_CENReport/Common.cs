using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json;
using System.Data;
using Helper;
using System.Text.RegularExpressions;

namespace SOH_LaunchPad_CENReport
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

        public static List<string> GetRestrictedMasterList(string name, string checkcol, string userid)
        {
            List<string> list = new List<string>();

            DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("SOHDB"), CommandType.Text,
                          $@"Select [Name] from CENRestrictConfig where {checkcol}='{name}'");
            if (rcd.Tables.Count > 0 && rcd.Tables[0].Rows.Count > 0)
            {
                string checkname = rcd.Tables[0].Rows[0]["Name"].ToString().Trim();

                DataSet rcd_2 = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("SOHDB"), CommandType.Text,
                                $@"Select [{checkname}] as [CheckData] from UserAccessCEN where UserID='{userid}'");

                if (rcd_2.Tables.Count > 0 && rcd_2.Tables[0].Rows.Count > 0)
                {
                    string dat = rcd_2.Tables[0].Rows[0]["CheckData"].ToString().Trim();

                    string[] includes = dat.Split(new char[] { ',' });

                    list.AddRange(includes);
                    list.Sort();
                }
            }
            else
            {
                return null;
            }

            return list;
        }

        public static List<string> GetRestrictListBySelName(string selname, string reportname, string userid)
        {
            List<string> list = new List<string>();

            DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("ReportDB"), CommandType.Text,
              $@"SELECT top 1 [DisplayName] FROM [dbo].[SOH_Selection_Config] where [ProgramID]='{reportname}' and [SelName]='{selname}'");
            if (rcd.Tables.Count > 0 && rcd.Tables[0].Rows.Count > 0)
            {
                string displayname = rcd.Tables[0].Rows[0]["DisplayName"].ToString().Trim();

                return GetRestrictedMasterList(displayname, "ConfigDisplayName", userid);
            }

            return null;
        }

        public static List<string> GetRestrictDisplaynameList()
        {
            List<string> list = new List<string>();

            DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("SOHDB"), CommandType.Text,
              $@"Select [ConfigDisplayName] from CENRestrictConfig");
            for (int r = 0; r < rcd.Tables[0].Rows.Count; r++)
            {
                var row = rcd.Tables[0].Rows[r];
                list.Add(row["ConfigDisplayName"].ToString().Trim());
            }

            return list;
        }

        public  static string WildCardToRegular(string value)
        {
            return "^" + Regex.Escape(value).Replace("\\?", ".").Replace("\\*", ".*") + "$";
        }
    }
}