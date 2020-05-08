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

        public static string WildCardToRegular(string value)
        {
            return "^" + Regex.Escape(value).Replace("\\?", ".").Replace("\\*", ".*") + "$";
        }

        public static bool CheckAccessByName(string userid, string checkname, List<string> checkvalues)
        {
            try
            {
                DataSet rcd_2 = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("SOHDB"), CommandType.Text,
                    $@"select FieldValue from RoleCENAccess 
                                    where FieldName='{checkname}' and RoleId in (select distinct RoleID from RoleUsers where UserName='{userid}')");

                if (rcd_2.Tables.Count > 0)
                {
                    List<string> includes = new List<string>();
                    for (int r = 0; r < rcd_2.Tables[0].Rows.Count; r++)
                    {
                        string dat = rcd_2.Tables[0].Rows[r]["FieldValue"].ToString().Trim();
                        includes.AddRange(dat.Split(new char[] { ',' }));
                    }

                    bool passCheck = true;
                    foreach (string checkval in checkvalues)
                    {
                        bool valCheck = false;
                        foreach (string inc in includes)
                        {
                            if (inc == "*")
                                return true;

                            if (inc.Contains("*"))
                            {
                                string pattern = Common.WildCardToRegular(inc);
                                if (Regex.IsMatch(checkval, pattern))
                                {
                                    valCheck = true;
                                    break;
                                }
                            }
                            else if (inc == checkval)
                            {
                                valCheck = true;
                                break;
                            }
                        }

                        passCheck = passCheck & valCheck;
                    }

                    return passCheck;
                }
            }
            catch (Exception ex)
            {

            }

            return false;
        }

        public static bool CheckAccessByClaimLevel(string userid, string checkname, string checkvalues)
        {
            try
            {
                DataSet rcd_2 = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("SOHDB"), CommandType.Text,
                    $@"select FieldValue from RoleCENAccess 
                                    where FieldName='{checkname}' and RoleId in (select distinct RoleID from RoleUsers where UserName='{userid}')");

                if (rcd_2.Tables.Count > 0)
                {
                    List<string> includes = new List<string>();
                    for (int r = 0; r < rcd_2.Tables[0].Rows.Count; r++)
                    {
                        string dat = rcd_2.Tables[0].Rows[r]["FieldValue"].ToString().Trim();
                        includes.AddRange(dat.Split(new char[] { ',' }));
                    }

                    foreach (string inc in includes)
                    {
                        if (inc == "*")
                            return true;

                        string[] tmpinc = inc.Split(new char[] { '_' });
                        int level = 0;
                        int.TryParse(tmpinc[2], out level);

                        string[] tmpcheck = checkvalues.Split(new char[] { '_' });
                        if (tmpcheck[0] == tmpinc[0] && tmpcheck[1] == tmpinc[1])
                        {
                            int level_inc = 0;
                            int level_chk = 0;
                            int.TryParse(tmpinc[2], out level_inc);
                            int.TryParse(tmpcheck[2], out level_chk);

                            if (level_inc >= level_chk)
                                return true;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
            }

            return false;
        }
    }
}