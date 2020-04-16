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
    /// Summary description for GetFuncMenu
    /// </summary>
    public class GetFuncMenu : IHttpHandler
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
                var systemid = HttpUtility.ParseQueryString(input).Get("SystemID");

                List<SqlParameter> paras = new List<SqlParameter>();
                paras.Add(new SqlParameter("@Token", token));
                paras.Add(new SqlParameter("@SystemID", systemid));
                DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("SOHDB"), CommandType.StoredProcedure, "p_GetSysFuncMenu", paras.ToArray());

                FunctionMenus menu = new FunctionMenus();
                if (rcd.Tables.Count > 0)
                {
                    for (int r = 0; r < rcd.Tables[0].Rows.Count; r++)
                    {
                        var row = rcd.Tables[0].Rows[r];
                        SysFunction func = new SysFunction();
                        func.FuncID = row["FunctionID"].ToString();
                        func.FuncName = row["FunctionName"].ToString();
                        func.FuncIcon = row["Icon"].ToString();
                        func.Sort = (int)row["Sort"];
                        func.ParentId = row["ParentId"].ToString();
                        func.FuncParas = row["FunctionParaAccess"].ToString();
                        func.Uri = row["Uri"].ToString();

                        menu.addNew(func);
                    }
                }

                menu.Sort();

                string jsonRet = JsonConvert.SerializeObject(menu);
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