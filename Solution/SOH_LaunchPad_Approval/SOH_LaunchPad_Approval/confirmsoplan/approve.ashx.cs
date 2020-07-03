using Newtonsoft.Json;
using SOH_LaunchPad_Approval.common;
using SOH_LaunchPad_Approval.confirmsoplan.src;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace SOH_LaunchPad_Approval.confirmsoplan
{
    /// <summary>
    /// Summary description for approve
    /// </summary>
    public class approve : HttpTaskAsyncHandler
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
                var data = HttpUtility.ParseQueryString(input).Get("Data");
                var approver = HttpUtility.ParseQueryString(input).Get("Approver");

                try
                {
                    RequestResult result = await Common.RequestUsername(token, sysfuncid);
                    if (result.Status == RequestResult.ResultStatus.Failure)
                        throw new Exception(result.Errmsg);

                    var tmp = JsonConvert.DeserializeObject<Dictionary<string, string>>(result.Data);
                    string userid = tmp["LAN_ID"];
                    string approverid = userid;

                    if (approver.Length > 1)
                    {
                        List<string> actingList = GetActingApprover.GetActingApproverList(userid, sysfuncid);
                        if (actingList.Contains(approver))
                            approverid = approver;
                    }

                    DAO.ConfirmSOPlanApproveRst rst = JsonConvert.DeserializeObject<DAO.ConfirmSOPlanApproveRst>(data);

                    DAO dao = new DAO();

                    var retDat = dao.Approve(approverid, rst);
                    string retJson = JsonConvert.SerializeObject(retDat);

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

        public override bool IsReusable
        {
            get
            {
                return false;
            }
        }
    }
}