using System;
using System.Collections.Generic;
using System.Web;
using Newtonsoft.Json;
using System.IO;
using System.Data;
using Helper;
using System.Data.SqlClient;
using System.Threading.Tasks;
using System.Net.Http;
using System.Configuration;

namespace SOH_LaunchPad_CENReport
{
    /// <summary>
    /// Summary description for AddReportQueue
    /// </summary>
    public class AddReportQueue : IHttpHandler
    {
        private static readonly string AuthWSEndpointUrl = ConfigurationManager.AppSettings["SOH.AuthWS.EndpointUrl"];

        public async void ProcessRequest(HttpContext context)
        {
            if (HttpContext.Current.Request.HttpMethod == "POST")
            {
                string input;
                using (StreamReader reader = new StreamReader(context.Request.InputStream))
                {
                    input = reader.ReadToEnd();
                }
                var token = HttpUtility.ParseQueryString(input).Get("Token");
                var sysfuncid = HttpUtility.ParseQueryString(input).Get("FuncID");
                var reportname = HttpUtility.ParseQueryString(input).Get("Report");
                var data = HttpUtility.ParseQueryString(input).Get("Data");

                try
                {
                    RequestResult result = await Common.RequestUsername(token, sysfuncid);
                    if (result.Status == RequestResult.ResultStatus.Failure)
                        throw new Exception(result.Errmsg);

                    var tmp = JsonConvert.DeserializeObject<Dictionary<string, string>>(result.Data);
                    string username = tmp["Username"];

                    var hidden = HttpUtility.ParseQueryString(input).Get("Hidden");
                    bool Ishidden = false;
                    bool.TryParse(hidden, out Ishidden);
                    List<SqlParameter> paras = new List<SqlParameter>();
                    paras.Add(new SqlParameter("@reportName", reportname));
                    paras.Add(new SqlParameter("@userName", username));
                    paras.Add(new SqlParameter("@requestData", data));
                    paras.Add(new SqlParameter("@hidden", Ishidden));
                    DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("SOHDB"), CommandType.StoredProcedure, "p_InsSAPReportQueue", paras.ToArray());

                    var row = rcd.Tables[0].Rows[0];

                    string qid = row["QueueID"].ToString();

                    RequestResult ret = new RequestResult(RequestResult.ResultStatus.Success);
                    ret.Data = qid;
                    context.Response.ContentType = "application/json";
                    context.Response.Write(JsonConvert.SerializeObject(ret));
                }
                catch (Exception ex)
                {
                    RequestResult result = new RequestResult(RequestResult.ResultStatus.Failure);
                    result.Errmsg = ex.Message;
                    context.Response.ContentType = "application/json";
                    context.Response.Write(JsonConvert.SerializeObject(result));
                }

                context.Response.StatusCode = 200;
                context.Response.StatusDescription = "OK";
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