using Newtonsoft.Json;
using SOH_LaunchPad_Approval.common;
using SOH_LaunchPad_Approval.soapproval.src;
using Helper;
using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace SOH_LaunchPad_Approval
{
    /// <summary>
    /// Summary description for GetActingApprover
    /// </summary>
    public class GetActingApprover : HttpTaskAsyncHandler
    {
        public override async Task ProcessRequestAsync(HttpContext context)
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

                try
                {
                    RequestResult result = await Common.RequestUsername(token, sysfuncid);
                    if (result.Status == RequestResult.ResultStatus.Failure)
                        throw new Exception(result.Errmsg);

                    var tmp = JsonConvert.DeserializeObject<Dictionary<string, string>>(result.Data);
                    string userid = tmp["LAN_ID"];

                    List<string> listApprover = GetActingApproverList(userid, sysfuncid);

                    string retJson = JsonConvert.SerializeObject(listApprover);

                    RequestResult ret = RequestResult.Create(RequestResult.ResultStatus.Success, retJson, "");

                    context.Response.ContentType = "application/json";
                    context.Response.Write(JsonConvert.SerializeObject(ret));
                }
                catch (Exception ex)
                {
                    RequestResult result = RequestResult.Error(ex.Message);
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

        public static List<string> GetActingApproverList(string userid, string sysfuncid)
        {
            List<string> list = new List<string>();

            DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("SOHDB"), CommandType.Text,
                            $@"SELECT isnull([Acting], '') as [Acting]
                              FROM [dbo].[UserApproverActing]
                              where UserID='{userid}' and FunctionID='{sysfuncid}'");


            for (int r = 0; r < rcd.Tables[0].Rows.Count; r++)
            {
                var row = rcd.Tables[0].Rows[r];
                string dat = row[0].ToString().Trim();

                list.Add(dat);
            }

            return list;
        }

        public override bool IsReusable
        {
            get
            {
                return false;
            }
        }
    }
}