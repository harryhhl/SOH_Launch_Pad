using System;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using System.Web;
using System.Data.SqlClient;
using System.Data;
using Helper;

namespace SOH_LaunchPad_Authen
{
    /// <summary>
    /// Summary description for JSLog
    /// </summary>
    public class JSLog : IHttpHandler
    {

        public void ProcessRequest(HttpContext context)
        {

            string method = HttpContext.Current.Request.HttpMethod;
            string url = HttpContext.Current.Request.Url.ToString();
            string input;
            using (StreamReader reader = new StreamReader(context.Request.InputStream))
            {
                input = reader.ReadToEnd();
            }

            var inputset = HttpUtility.ParseQueryString(input);
            var data = inputset.Get("data");
            var nav = inputset.Get("nav");
            try
            {
                List<SqlParameter> paras = new List<SqlParameter>();
                paras.Add(new SqlParameter("@data", data));
                paras.Add(new SqlParameter("@nav", nav));
                SqlHelper.ExecuteNonQuery(SqlHelper.GetConnection("SOHDB"), CommandType.Text,
                 $@"INSERT INTO dbo.JS_Log(Nav,Data) VALUES(@nav, @data)", paras.ToArray());
            }
            catch (Exception ex)
            {
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