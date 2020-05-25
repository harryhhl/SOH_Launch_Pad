using System;
using System.Collections.Generic;
using System.Web;
using Newtonsoft.Json;
using System.IO;
using System.Data;
using System.Linq;
using Helper;
using System.Data.SqlClient;
using System.Net.Http;
using System.Threading.Tasks;
using NPOI.SS.UserModel;
using NPOI.XSSF.UserModel;
using NPOI.SS.Util;

namespace SOH_LaunchPad_CENReport
{
    /// <summary>
    /// Summary description for CallReport
    /// </summary>
    public class CallReport : IHttpHandler
    {
        public async void ProcessRequest(HttpContext context)
        {
            if (HttpContext.Current.Request.HttpMethod == "POST")
            {
                string input;
                using (StreamReader reader = new StreamReader(context.Request.InputStream))
                {
                    input = reader.ReadToEnd();
                }
                var qid = HttpUtility.ParseQueryString(input).Get("ReportQueueId");
                var token = HttpUtility.ParseQueryString(input).Get("Token");
                var sysfuncid = HttpUtility.ParseQueryString(input).Get("FuncID");

                try
                {
                    DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("SOHDB"), CommandType.Text,
                    $@"SELECT top 1 [ReportName],[Username],[RequestData]
                       FROM [dbo].[SAPReportQueue]
                       where Id = '{qid}'");

                    if (rcd.Tables.Count > 0)
                    {
                        var row = rcd.Tables[0].Rows[0];

                        RequstModel req = JsonConvert.DeserializeObject<RequstModel>(row["RequestData"].ToString());
                        string CreatedBy = row["Username"].ToString();
                        string ReportName = row["ReportName"].ToString();

                        RequestResult result = await Common.RequestUsername(token, sysfuncid);
                        if (result.Status == RequestResult.ResultStatus.Failure)
                            throw new Exception(result.Errmsg);

                        var tmp = JsonConvert.DeserializeObject<Dictionary<string, string>>(result.Data);
                        req.UpdateSelectionByRestriction(tmp["LAN_ID"]);

                        foreach (var sel in req.Selection)
                        {
                            string insertquery = $@"INSERT INTO [dbo].[SOH_Selection_Detail]
                                            ([SelectionID]
                                            ,[ProgramID]
                                            ,[SelName]
                                            ,[Kind]
                                            ,[Sign]
                                            ,[SelOption]
                                            ,[Low]
                                            ,[High]
                                            ,[CreatedOn]
                                            ,[CreatedBy])
                                        VALUES
                                            ('{qid}'
                                            ,'{req.ReportName}'
                                            ,'{sel.SelName}'
                                            ,'{sel.Kind}'
                                            ,'{sel.Sign}'
                                            ,'{sel.SelOption}'
                                            ,'{sel.Low}'
                                            ,'{sel.High}'
                                            ,getdate()
                                            ,'{CreatedBy}')
                                            ";

                            SqlHelper.ExecuteNonQuery(SqlHelper.GetConnection("ReportDB"), CommandType.Text, insertquery);
                        }

                        SAPProc sp = new SAPProc();
                        string ret = sp.Run(qid);
                        if (ret != "OK")
                        {
                            string err = "SAPError: " + ret;
                            HandleEmailNotification(qid, new ReportMessage() { Type = "E", Message = err }, ReportName, token, CreatedBy);
                            throw new Exception(err);
                        }

                        System.Threading.Thread.Sleep(500);

                        ReportMessage rm = GetReportMessageResult(qid);
                        if(rm.Type == "S")
                            UpdateReportQueueStatus(qid, 1, "", rm.Message);
                        else
                            UpdateReportQueueStatus(qid, 2, rm.Message, "");

                        HandleEmailNotification(qid, rm, ReportName, token, CreatedBy);
                    }
                }
                catch(Exception ex)
                {
                    UpdateReportQueueStatus(qid, -1, ex.Message +" " + (ex.InnerException==null?"":ex.InnerException.Message));
                }

                context.Response.StatusCode = 200;
                context.Response.Write(JsonConvert.SerializeObject(new RequestResult(RequestResult.ResultStatus.Success)));
            }
            else
            {
                context.Response.StatusCode = 405;
                context.Response.StatusDescription = "Sorry, only POST method allowed";
            }

        }

        private void HandleEmailNotification(string qid, ReportMessage rptMsg, string rptName, string token, string userName)
        {
            DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("SOHDB"), CommandType.Text,
                $@"SELECT TOP 1 [Id] FROM [dbo].[NotificationCenter] where [Para]='{qid}' and [Type]=1");

            if(rcd.Tables.Count > 0 && rcd.Tables[0].Rows.Count > 0)
            {
                string nid = rcd.Tables[0].Rows[0]["Id"].ToString();

                string tcode = GetTCode(rptName);

                if (rptMsg.Type != "S")
                {
                    WriteToEMLDB(userName, qid, "", null, $"SOH - {tcode} run failed", $"Report failed: {rptMsg.Message}");
                }
                else if (rptMsg.Message == "ALV")
                {
                    var config = GetALVReportSchema.GetConfigFromReportDB(rptName, qid);
                    var columnSettings = JsonConvert.DeserializeObject<List<GetALVReportSchema.KendoGridColumnSetting>>(config.ColumnSetting);
                    var reportData = GetALVReportData.GetReportData(rptName, qid);
                    var reportLayout = ReportLayout.GetReportObjDefault(rptName, userName);
                    
                    if(reportLayout != null)
                    {
                        List<GetALVReportSchema.KendoGridColumnSetting> newColumnSettings = new List<GetALVReportSchema.KendoGridColumnSetting>();
                        foreach (var layoutcol in reportLayout.columns)
                        {
                            if (layoutcol.hidden != null && layoutcol.hidden == true) continue;
                            var cs = columnSettings.FirstOrDefault(c => c.field == layoutcol.field);
                            if (cs == null) continue;
                            newColumnSettings.Add(cs);
                        }
                        columnSettings = newColumnSettings;
                    }

                    IWorkbook wb = new XSSFWorkbook();
                    ISheet sheet = wb.CreateSheet();

                    IRow header = sheet.CreateRow(0);

                    XSSFCellStyle cellStyleHeader = (XSSFCellStyle)wb.CreateCellStyle();
                    cellStyleHeader.FillForegroundColor = IndexedColors.LightTurquoise.Index;
                    cellStyleHeader.FillPattern = FillPattern.SolidForeground;

                    for (int c = 0; c < columnSettings.Count; c++)
                    {
                        ICell col = header.CreateCell(c);
                        col.SetCellValue(columnSettings[c].title);
                        col.CellStyle = cellStyleHeader;
                    }

                    for (int r = 0; r < reportData.ListData.Count; r++)
                    {
                        IRow row = sheet.CreateRow(r + 1);
                        for (int c = 0; c < columnSettings.Count; c++)
                        {
                            ICell col = row.CreateCell(c);
                            string coln = columnSettings[c].field;
                            
                            if (reportData.ListData[r].ContainsKey(coln) && reportData.ListData[r][coln] != null)
                                col.SetCellValue(reportData.ListData[r][coln].ToString());
                            else
                                col.SetCellValue("");
                        }
                    }

                    using (MemoryStream ms = new MemoryStream())
                    {
                        wb.Write(ms);

                        string filename = $@"{tcode}_{DateTime.Now.ToString("yyyyMMddHHmm")}.xlsx";
                        WriteToEMLDB(userName, qid, filename, ms.ToArray(), $"SOH - {tcode} is completed", "Report run success.");
                    }

                    wb.Close();
                    wb = null;
                }
                else if (rptMsg.Message == "File")
                {
                    var rptDataList = GetFileReportData.GetReportFileData(qid);
                    var rptData = rptDataList[0];
                    WriteToEMLDB(userName, qid, rptData.FileName, rptData.FileData, $"SOH - {tcode} is completed", "Report run success.");
                }
            }
        }

        private void WriteToEMLDB(string userEmail, string mailID, string filename, byte[] filecontent, string subject, string body)
        {
            string rid = "";

            if (filename.Length > 0)
            {
                List<SqlParameter> paras = new List<SqlParameter>();
                paras.Add(new SqlParameter("@FileName", filename));
                paras.Add(new SqlParameter("@FileContent", filecontent));
                paras.Add(new SqlParameter("@RID", SqlDbType.UniqueIdentifier));
                paras[2].Direction = ParameterDirection.Output;
                SqlHelper.ExecuteNonQuery(SqlHelper.GetConnection("EMLDB"), CommandType.StoredProcedure, "p_InsertMailAttachment", paras.ToArray());

                rid = paras[2].Value.ToString();
            }

            List<SqlParameter> paras2 = new List<SqlParameter>();
            paras2.Add(new SqlParameter("@SystemID", "SOH"));
            paras2.Add(new SqlParameter("@MailID", mailID));
            paras2.Add(new SqlParameter("@ProfileName", GetEmailProfile()));
            paras2.Add(new SqlParameter("@Subject", subject));
            paras2.Add(new SqlParameter("@FromID", "SOH"));
            paras2.Add(new SqlParameter("@ToID", userEmail));
            paras2.Add(new SqlParameter("@CCID", ""));
            paras2.Add(new SqlParameter("@BCID", ""));
            paras2.Add(new SqlParameter("@BodyFormat", "HTML"));
            paras2.Add(new SqlParameter("@Body", body));
            paras2.Add(new SqlParameter("@FileAttachments", rid));
            SqlHelper.ExecuteNonQuery(SqlHelper.GetConnection("EMLDB"), CommandType.StoredProcedure, "p_InsertMailList", paras2.ToArray());
        }

        private string GetEmailProfile()
        {
            return Common.GetSysSettings("EMLDB_Profile");
        }

        private void UpdateReportQueueStatus(string qid, int statuscode, string message, string outputtype="")
        {
            List<SqlParameter> paras = new List<SqlParameter>();
            paras.Add(new SqlParameter("@ID", qid));
            paras.Add(new SqlParameter("@Status", statuscode));
            paras.Add(new SqlParameter("@Msg", message));
            paras.Add(new SqlParameter("@OutputType", outputtype));
            SqlHelper.ExecuteNonQuery(SqlHelper.GetConnection("SOHDB"), CommandType.StoredProcedure, "p_UpdateSAPReportQueue", paras.ToArray());
        }

        private string GetTCode(string rptName)
        {
            try
            {
                DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("ReportDB"), CommandType.Text,
                $@"SELECT [TCode] FROM [dbo].[SOH_Program] where ProgramID='{rptName}'");

                var row = rcd.Tables[0].Rows[0];
                var tcode = row["TCode"].ToString().Trim();

                return tcode;
            }
            catch (Exception ex)
            {
                return rptName;
            }
        }

        private ReportMessage GetReportMessageResult(string qid)
        {
            try
            {
                DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("ReportDB"), CommandType.Text,
                $@"SELECT [Type],[Message] FROM [dbo].[SOH_Message_Log] where SelectionID='{qid}'");

                var row = rcd.Tables[0].Rows[0];

                ReportMessage rm = new ReportMessage();
                rm.Type = row["Type"].ToString();
                rm.Message = row["Message"].ToString();

                return rm;
            }
            catch (Exception ex)
            {
                throw new Exception("GetResultFail: " + ex.Message);
            }
        }

        public class ReportMessage
        {
            public string Type;
            public string Message;
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