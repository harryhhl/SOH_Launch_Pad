using System;
using System.Linq;
using System.Collections.Generic;
using System.Web;
using Newtonsoft.Json;
using System.IO;
using System.Data;
using Helper;

namespace SOH_LaunchPad_CENReport
{
    /// <summary>
    /// Summary description for GetFileReportData
    /// </summary>
    public class GetFileReportData : IHttpHandler
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
                var reportname = HttpUtility.ParseQueryString(input).Get("Report");
                var qid = HttpUtility.ParseQueryString(input).Get("QID");
                var type = HttpUtility.ParseQueryString(input).Get("Type");

                try
                {
                    List<ReportFileData> rptList = GetReportFileData(qid, type);
                    
                    RequestResult ret = new RequestResult(RequestResult.ResultStatus.Success);
                    ret.Data = JsonConvert.SerializeObject(rptList);
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
            }
            else
            {
                context.Response.StatusCode = 405;
                context.Response.StatusDescription = "Sorry, only POST method allowed";
            }
        }

        public static List<ReportFileData> GetReportFileData(string qid, string selectedType=null)
        {
            List<ReportFileData> rptList = new List<ReportFileData>();

            string typestr = "";
            if (!string.IsNullOrEmpty(selectedType))
                typestr = $"and [FileType]='{selectedType}'";

            DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("ReportDB"), CommandType.Text,
                    $@"SELECT ([FileName]+'.'+[FileType]) as [FileName], [FileData]
                                FROM [dbo].[SOH_Export_File] where SelectionID='{qid}' {typestr}");

            for (int r = 0; r < rcd.Tables[0].Rows.Count; r++)
            {
                var row = rcd.Tables[0].Rows[r];
                ReportFileData rpt = new ReportFileData();

                rpt.FileName = row["FileName"].ToString();
                byte[] tmpdata = (byte[])row["FileData"];
                rpt.FileData = tmpdata;
                rpt.FileDataBase64 = Convert.ToBase64String(tmpdata);

                rptList.Add(rpt);
            }
 
            return rptList;
        }

        public class ReportFileData
        {
            public string FileName;
            public string FileDataBase64;

            [JsonIgnore]
            public byte[] FileData;
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