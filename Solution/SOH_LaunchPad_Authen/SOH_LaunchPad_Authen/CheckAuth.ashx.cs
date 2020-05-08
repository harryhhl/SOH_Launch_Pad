using Helper;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Web;

namespace SOH_LaunchPad_Authen
{
    /// <summary>
    /// Summary description for CheckAuth
    /// </summary>
    public class CheckAuth : IHttpHandler
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
                var token = HttpUtility.ParseQueryString(input).Get("Token");
                var funcID = HttpUtility.ParseQueryString(input).Get("SysFuncID");
      
                List<SqlParameter> paras = new List<SqlParameter>();
                paras.Add(new SqlParameter("@Token", token));
                paras.Add(new SqlParameter("@SystemFuncID", funcID));
                DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("SOHDB"), CommandType.StoredProcedure, "p_CheckAuth", paras.ToArray());

                RequestResult result = new RequestResult();

                if (rcd.Tables.Count > 0)
                {
                    Dictionary<string, string> dataset = new Dictionary<string, string>();

                    if (rcd.Tables[0].Rows.Count >= 1)
                    {
                        var row = rcd.Tables[0].Rows[0];
                        dataset.Add("Username", row["Username"].ToString());
                        dataset.Add("LAN_ID", row["LAN_ID"].ToString());
                    }

                    if (rcd.Tables.Count > 1 && rcd.Tables[1].Rows.Count >= 1)
                    {
                        var row = rcd.Tables[1].Rows[0];
                        var access = row["Access"].ToString();
                        if(access != "1")
                        {
                            result.Status = RequestResult.ResultStatus.Failure;
                            result.Errmsg = "Unknown!";
                        }

                        dataset.Add("FuncPara", row["FunctionParaAccess"].ToString());
                    }
                    else
                    {
                        result.Status = RequestResult.ResultStatus.Failure;
                        result.Errmsg = "User No Access right!";
                    }

                    result.Data = JsonConvert.SerializeObject(dataset);
                }
                else
                {
                    result.Status = RequestResult.ResultStatus.Failure;
                    result.Errmsg = "User not Authen!";
                }

                string jsonRet = JsonConvert.SerializeObject(result);
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