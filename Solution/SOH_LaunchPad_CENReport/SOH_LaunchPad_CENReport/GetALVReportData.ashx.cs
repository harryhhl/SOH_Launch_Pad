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
    /// Summary description for GetALVReportData
    /// </summary>
    public class GetALVReportData : IHttpHandler
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


                try
                {
                    ReportData rpt = GetReportData(reportname, qid);

                    RequestResult ret = new RequestResult(RequestResult.ResultStatus.Success);
                    ret.Data = JsonConvert.SerializeObject(rpt);
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

        public static ReportData GetReportData(string reportname, string qid)
        {
            var colname = GetColumnNames(reportname);
            ReportData rpt = new ReportData();

            DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("ReportDB"), CommandType.Text,
                    $@"SELECT * FROM [dbo].[{reportname}] where SelectionID='{qid}'");

            for (int r = 0; r < rcd.Tables[0].Rows.Count; r++)
            {
                var row = rcd.Tables[0].Rows[r];

                Dictionary<string, object> dic = new Dictionary<string, object>();
                foreach (KeyValuePair<string,string> col in colname)
                {
                    if (col.Value == "date")
                    {
                        try
                        {
                            var dat = (DateTime)row[col.Key];
                            if(dat < new DateTime(1933, 1, 1))
                                dic.Add(Common.KendoSaveChar(col.Key), null);
                            else
                                dic.Add(Common.KendoSaveChar(col.Key), row[col.Key]);
                        }
                        catch(Exception)
                        {
                            dic.Add(Common.KendoSaveChar(col.Key), null);
                        }
                    }
                    else
                    {
                        dic.Add(Common.KendoSaveChar(col.Key), row[col.Key]);
                    }
                }

                rpt.ListData.Add(dic);
            }

            return rpt;
        }

        private static Dictionary<string, string> GetColumnNames(string reportname)
        {
            Dictionary<string, string> cols = new Dictionary<string, string>();
            DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("ReportDB"), CommandType.Text,
                                $@"select COLUMN_NAME,DATA_TYPE
                                from INFORMATION_SCHEMA.COLUMNS
                                where TABLE_NAME='{reportname}' and COLUMN_NAME<>'SelectionID'
                                order by ORDINAL_POSITION asc");

            for (int r = 0; r < rcd.Tables[0].Rows.Count; r++)
            {
                var row = rcd.Tables[0].Rows[r];

                string columnname = row["COLUMN_NAME"].ToString();
                string datatype = row["DATA_TYPE"].ToString();
                cols.Add(columnname, datatype);
            }

            return cols;
        }

        public class ReportData
        {
            public List<Dictionary<string, object>> ListData = new List<Dictionary<string, object>>();

            public int TotalCount
            {
                get
                {
                    return ListData.Count;
                }
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