using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Data.SqlClient;
using System.Data;
using Newtonsoft.Json;
using Helper;


namespace SOH_LaunchPad_Authen
{
    /// <summary>
    /// Summary description for GetAuth
    /// </summary>
    public class GetAuth : IHttpHandler
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
                var tokeninfo = HttpUtility.ParseQueryString(input).Get("Account");
                var tokenid = HttpUtility.ParseQueryString(input).Get("AzureToken");
                var useragent = HttpUtility.ParseQueryString(input).Get("UserAgent");
                AzureAccount azureacc = JsonConvert.DeserializeObject<AzureAccount>(tokeninfo);

                List<SqlParameter> paras = new List<SqlParameter>();
                paras.Add(new SqlParameter("@Name", azureacc.name));
                paras.Add(new SqlParameter("@Username", azureacc.userName));
                paras.Add(new SqlParameter("@TokenId", tokenid));
                paras.Add(new SqlParameter("@TokenInfo", tokeninfo));
                paras.Add(new SqlParameter("@UserAgent", useragent));
                DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("SOHDB"), CommandType.StoredProcedure, "p_UserLogin", paras.ToArray());

                Systems syss = new Systems();

                if (rcd.Tables.Count > 0)
                {
                    for(int r=0; r<rcd.Tables[0].Rows.Count; r++)
                    {
                        var row = rcd.Tables[0].Rows[r];
                        syss.AddNew(row["SystemID"].ToString(), row["SystemName"].ToString(), row["Icon"].ToString());
                    }
                }

                string jsonRet = JsonConvert.SerializeObject(syss);
                context.Response.ContentType = "application/json";
                context.Response.Write(jsonRet);
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