using System;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using System.Web;
using System.Data.SqlClient;
using System.Data;
using Newtonsoft.Json;
using Helper;

namespace SOH_LaunchPad_Authen
{
    /// <summary>
    /// Summary description for Common
    /// </summary>
    public class Common : IHttpHandler
    {
        public void ProcessRequest(HttpContext context)
        {
            if (HttpContext.Current.Request.HttpMethod == "POST")
            {
                string input;
                using (StreamReader reader = new StreamReader(context.Request.InputStream))
                {
                    input = reader.ReadToEnd();
                }

                var inputset = HttpUtility.ParseQueryString(input);
                var action = inputset.Get("Action");
                var token = inputset.Get("Token");
                var sysfuncid = inputset.Get("FuncID");
                var username = inputset.Get("User");

                try
                {
                    if (action == "setfuncpref")
                    {
                        var key = inputset.Get("Key");
                        var value = inputset.Get("Val");

                        SetFuncPreference(username, sysfuncid, key, value);

                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(RequestResult.Ok()));
                    }
                    else if (action == "getfuncpref")
                    {
                        var data = GetFuncPreference(username, sysfuncid);

                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(RequestResult.Ok(data)));
                    }
                    else
                    {
                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(RequestResult.Error("No Action is defined")));
                    }
                }
                catch (Exception ex)
                {
                    context.Response.ContentType = "application/json";
                    context.Response.Write(JsonConvert.SerializeObject(RequestResult.Error(ex.Message)));
                }
            }
            else
            {
                context.Response.StatusCode = 405;
                context.Response.StatusDescription = "Sorry, only POST method allowed";
            }
        }

        private void SetFuncPreference(string username, string sysfuncid, string key, string value)
        {
            List<SqlParameter> paras = new List<SqlParameter>();
            paras.Add(new SqlParameter("@Username", username));
            paras.Add(new SqlParameter("@SystemFuncID", sysfuncid));
            paras.Add(new SqlParameter("@PreKey", key));
            paras.Add(new SqlParameter("@PreVal", value));
            SqlHelper.ExecuteNonQuery(SqlHelper.GetConnection("SOHDB"), CommandType.StoredProcedure, "p_SetPreference", paras.ToArray());
        }

        private Dictionary<string, object> GetFuncPreference(string username, string sysfuncid)
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

        public bool IsReusable
        {
            get
            {
                return false;
            }
        }
    }
}