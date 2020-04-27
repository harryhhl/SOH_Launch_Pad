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
using crystal_sap_cryto;
using System.Data.SqlClient;

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
                          $@"Select [Name],[MstTable] from CENRestrictConfig where {checkcol}='{name}'");
            if (rcd.Tables.Count > 0 && rcd.Tables[0].Rows.Count > 0)
            {
                string checkname = rcd.Tables[0].Rows[0]["Name"].ToString().Trim();
                string mstTable = rcd.Tables[0].Rows[0]["MstTable"].ToString().Trim();

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

                    foreach(string inc in includes)
                    {
                        if(inc.Contains("*"))
                        {
                            string ckinc = inc.Replace("*", "%");
                            DataSet rcd_3 = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("ReportDB"), CommandType.Text,
                                    $@"Select [Code] from {mstTable} where [Code] like '{ckinc}'");

                            if (rcd_3.Tables.Count > 0 && rcd_3.Tables[0].Rows.Count > 0)
                            {
                                for (int r = 0; r < rcd_3.Tables[0].Rows.Count; r++)
                                {
                                    var row = rcd_3.Tables[0].Rows[r];
                                    string code = row["Code"].ToString().Trim();
                                    list.Add(code);
                                }
                            }
                        }
                        else
                        {
                            list.Add(inc);
                        }
                    }

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

        public static string GetSysSettings(string key)
        {
            var settings = Common.GetSysSettings();
            if (settings.Keys.Contains(key))
                return settings[key];
            else
                return "";
        }

        public  static string WildCardToRegular(string value)
        {
            return "^" + Regex.Escape(value).Replace("\\?", ".").Replace("\\*", ".*") + "$";
        }
    }
}