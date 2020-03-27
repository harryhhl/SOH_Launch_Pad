using Helper;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web;
using System.Web.Hosting;
using System.Web.SessionState;

namespace SOH_LaunchPad_Web
{
    /// <summary>
    /// Summary description for SapReport
    /// </summary>
    public class SapReport : HttpTaskAsyncHandler, IRequiresSessionState
    {
        private static readonly string AuthWSEndpointUrl = ConfigurationManager.AppSettings["SOH.AuthWS.EndpointUrl"];
        private static readonly string SapReportWSEndpointUrl = ConfigurationManager.AppSettings["SOH.SapReportWS.EndpointUrl"];

        public override async Task ProcessRequestAsync(HttpContext context)
        {
            if (HttpContext.Current.Request.HttpMethod == "POST")
            {
                string input;
                using (StreamReader reader = new StreamReader(context.Request.InputStream))
                {
                    input = reader.ReadToEnd();
                }

                var inputset = HttpUtility.ParseQueryString(input);
                var action = inputset.Get("Action");
                var token = inputset.Get("Token");
                var sysfuncid = inputset.Get("FuncID");
                var reportname = inputset.Get("Report");

                if (action == "new")
                {
                    var requestforQID = await GenericRequest.Post(SapReportWSEndpointUrl + "AddReportQueue.ashx", new StringContent(input));

                    if (requestforQID.Status == RequestResult.ResultStatus.Failure)
                    {
                        context.Response.StatusCode = 500;
                        context.Response.StatusDescription = requestforQID.Errmsg;
                        return;
                    }

                    string qid = requestforQID.Data;

                    CallReport(qid, token, sysfuncid);
                    context.Response.ContentType = "application/json";
                    context.Response.Write(JsonConvert.SerializeObject(requestforQID));
                }
                else if (action == "getqueue")
                {
                    var result = await GenericRequest.Post(SapReportWSEndpointUrl + "GetReportQueue.ashx", new StringContent(input));
                    if (result.Status == RequestResult.ResultStatus.Failure)
                    {
                        context.Response.StatusCode = 400;
                        context.Response.StatusDescription = result.GetErrmsgTrim();
                    }
                    else
                    {
                        context.Response.ContentType = "application/json";
                        context.Response.Write(result.Data);
                    }
                }
                else if (action == "getconfig")
                {
                    var result = await GenericRequest.Post(SapReportWSEndpointUrl + "GetReportConfig.ashx", new StringContent(input));
                    if (result.Status == RequestResult.ResultStatus.Failure)
                    {
                        context.Response.StatusCode = 400;
                        context.Response.StatusDescription = result.GetErrmsgTrim();
                    }
                    else
                    {
                        context.Response.ContentType = "application/json";
                        context.Response.Write(result.Data);
                    }
                }
                else if (action == "getalvschema")
                {
                    var result = await GenericRequest.Post(SapReportWSEndpointUrl + "GetALVReportSchema.ashx", new StringContent(input));
                    if (result.Status == RequestResult.ResultStatus.Failure)
                    {
                        context.Response.StatusCode = 400;
                        context.Response.StatusDescription = result.GetErrmsgTrim();
                    }
                    else
                    {
                        context.Response.ContentType = "application/json";
                        context.Response.Write(result.Data);
                    }
                }
                else if (action == "getalvdata")
                {
                    var result = await GenericRequest.Post(SapReportWSEndpointUrl + "GetALVReportData.ashx", new StringContent(input));
                    if (result.Status == RequestResult.ResultStatus.Failure)
                    {
                        context.Response.StatusCode = 400;
                        context.Response.StatusDescription = result.GetErrmsgTrim();
                    }
                    else
                    {
                        context.Response.ContentType = "application/json";
                        context.Response.Write(result.Data);
                    }
                }
                else if (action == "getfiledata")
                {
                    var result = await GenericRequest.Post(SapReportWSEndpointUrl + "GetFileReportData.ashx", new StringContent(input));
                    if (result.Status == RequestResult.ResultStatus.Failure)
                    {
                        context.Response.StatusCode = 400;
                        context.Response.StatusDescription = result.GetErrmsgTrim();
                    }
                    else
                    {
                        context.Response.ContentType = "application/json";
                        context.Response.Write(result.Data);
                    }
                }
                else if (action == "getmasterdata")
                {
                    var mastername = inputset.Get("MstName");
                    string masterdata = HttpContext.Current.Session["Mst_" + mastername] as string;
                    if (string.IsNullOrEmpty(masterdata))
                    {
                        var result = await GenericRequest.Post(SapReportWSEndpointUrl + "GetReportMaster.ashx", new StringContent(input));
                        if (result.Status == RequestResult.ResultStatus.Failure)
                        {
                            context.Response.StatusCode = 400;
                            context.Response.StatusDescription = result.GetErrmsgTrim();
                            return;
                        }
                        else
                        {
                            masterdata = result.Data;
                            HttpContext.Current.Session["Mst_" + mastername] = masterdata;
                        }
                    }

                    string skip = inputset.Get("skip");
                    string take = inputset.Get("take");
                    string filter = inputset.Get("filter");

                    if ((skip != null && take != null) || !string.IsNullOrEmpty(filter))
                    {
                        MasterDataSet mds = JsonConvert.DeserializeObject<MasterDataSet>(masterdata);

                        var filterSet = KendoFilterLevel3.Parse(filter);
                        mds.ApplyFilter(filterSet);
                        mds.ApplyPaging(int.Parse(skip), int.Parse(take));

                        masterdata = JsonConvert.SerializeObject(mds);
                    }

                    context.Response.ContentType = "application/json";
                    context.Response.Write(masterdata);

                }
                else if (action == "getmasterdataValueMap")
                {
                    var result = await GenericRequest.Post(SapReportWSEndpointUrl + "GetReportMaster.ashx", new StringContent(input));
                    if (result.Status == RequestResult.ResultStatus.Failure)
                    {
                        context.Response.StatusCode = 400;
                        context.Response.StatusDescription = result.GetErrmsgTrim();
                    }
                    else
                    {
                        string mapdata = inputset.Get("DataMap");
                        List<string> list = JsonConvert.DeserializeObject<List<string>>(mapdata);

                        string resultData = result.Data;
                        MasterDataSet mds = JsonConvert.DeserializeObject<MasterDataSet>(resultData);

                        var indice = mds.GetIndice(list);

                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(indice));
                    }

                }
                else if (action == "getrptlayout")
                {
                    try
                    {
                        var username = inputset.Get("User");
                        var layoutlist = GetReportLayoutByUser(reportname, username);

                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(layoutlist));
                    }
                    catch (Exception ex)
                    {
                        context.Response.StatusCode = 400;
                        context.Response.StatusDescription = $@"Error: {ex.Message}";
                    }

                }
                else if (action == "newrptlayout")
                {
                    try
                    {
                        var username = inputset.Get("User");
                        var layoutname = inputset.Get("LayoutName");
                        var layoutcontent = inputset.Get("LayoutContent");

                        var layoutId = CreateNewReportLayout(reportname, username, layoutname, layoutcontent);

                        List<ReportLayoutData> list = new List<ReportLayoutData>();
                        list.Add(new ReportLayoutData() { Id = layoutId, LayoutName = layoutname, LayoutContent = layoutcontent });

                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(list));
                    }
                    catch (Exception ex)
                    {
                        context.Response.StatusCode = 400;
                        context.Response.StatusDescription = $@"Error: {ex.Message}";
                    }
                }
                else if (action == "updrptlayout")
                {
                    try
                    {
                        var layoutID = inputset.Get("LayoutID");
                        var layoutname = inputset.Get("LayoutName");
                        var layoutcontent = inputset.Get("LayoutContent");

                        UpdateReportLayout(layoutID, layoutname, layoutcontent);

                        context.Response.ContentType = "application/json";
                        context.Response.Write("{}");
                    }
                    catch (Exception ex)
                    {
                        context.Response.StatusCode = 400;
                        context.Response.StatusDescription = $@"Error: {ex.Message}";
                    }
                }
                else if (action == "updrptlayoutdefault")
                {
                    try
                    {
                        var layoutID = inputset.Get("LayoutID");

                        UpdateReportLayoutDefault(layoutID);

                        context.Response.ContentType = "application/json";
                        context.Response.Write("{}");
                    }
                    catch (Exception ex)
                    {
                        context.Response.StatusCode = 400;
                        context.Response.StatusDescription = $@"Error: {ex.Message}";
                    }
                }
                else if (action == "delrptlayout")
                {
                    try
                    {
                        var layoutID = inputset.Get("LayoutID");

                        DeleteReportLayout(layoutID);

                        context.Response.ContentType = "application/json";
                        context.Response.Write("{}");
                    }
                    catch (Exception ex)
                    {
                        context.Response.StatusCode = 400;
                        context.Response.StatusDescription = $@"Error: {ex.Message}";
                    }
                }
                else
                {
                    context.Response.StatusCode = 400;
                    context.Response.StatusDescription = "No Action is defined";
                }

            }
            else
            {
                context.Response.StatusCode = 405;
                context.Response.StatusDescription = "Sorry, only POST method allowed";
            }
        }

        private void CallReport(string qid, string token, string sysfuncid)
        {
            HostingEnvironment.QueueBackgroundWorkItem(async cancellationToken =>
            {
                string uri = "CallReport.ashx";

                Dictionary<string, string> jsonValues = new Dictionary<string, string>();
                jsonValues.Add("Token", token);
                jsonValues.Add("ReportQueueId", qid);
                jsonValues.Add("FuncID", sysfuncid);
                using (var content = new FormUrlEncodedContent(jsonValues))
                {
                    var ret = await GenericRequest.Post(SapReportWSEndpointUrl + uri, content);
                }
            });            
        }

        private List<ReportLayoutData> GetReportLayoutByUser(string rptname, string username)
        {
            DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("SOHDB"), CommandType.Text,
                            $@"SELECT [Id],[LayoutName],[LayoutContent],isnull([IsDefault],0) as [IsDefault] FROM [dbo].[SAPReportLayout]
                                WHERE ReportName='{rptname}' and Username='{username}';");

            List<ReportLayoutData> list = new List<ReportLayoutData>();
            list.Add(new ReportLayoutData() { Id = Guid.NewGuid().ToString(), LayoutName = "Default", LayoutContent = "" });

            for (int r = 0; r < rcd.Tables[0].Rows.Count; r++)
            {
                var row = rcd.Tables[0].Rows[r];

                ReportLayoutData item = new ReportLayoutData();
                item.Id = row["Id"].ToString().Trim();
                item.LayoutName = row["LayoutName"].ToString().Trim();
                item.LayoutContent = row["LayoutContent"].ToString().Trim();
                item.IsDefault = bool.Parse(row["IsDefault"].ToString());

                list.Add(item);
            }

            return list;
        }

        private string CreateNewReportLayout(string rptname, string username, string layoutname, string layoutcontent)
        {
            List<SqlParameter> paras = new List<SqlParameter>();
            paras.Add(new SqlParameter("@reportName", rptname));
            paras.Add(new SqlParameter("@userName", username));
            paras.Add(new SqlParameter("@layoutName", layoutname));
            paras.Add(new SqlParameter("@layoutContent", layoutcontent));
            DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("SOHDB"), CommandType.StoredProcedure, "p_InsSAPReportLayout", paras.ToArray());

            var row = rcd.Tables[0].Rows[0];

            string id = row["LayoutID"].ToString();

            return id;
        }

        private void UpdateReportLayout(string id, string layoutname, string layoutcontent)
        {
            List<SqlParameter> paras = new List<SqlParameter>();
            paras.Add(new SqlParameter("@layoutID", id));
            paras.Add(new SqlParameter("@layoutName", layoutname));
            paras.Add(new SqlParameter("@layoutContent", layoutcontent));
            SqlHelper.ExecuteNonQuery(SqlHelper.GetConnection("SOHDB"), CommandType.StoredProcedure, "p_UpdateSAPReportLayout", paras.ToArray());
        }

        private void UpdateReportLayoutDefault(string id)
        {
            List<SqlParameter> paras = new List<SqlParameter>();
            paras.Add(new SqlParameter("@layoutID", id));
            SqlHelper.ExecuteNonQuery(SqlHelper.GetConnection("SOHDB"), CommandType.StoredProcedure, "p_UpdateSAPReportLayoutDefault", paras.ToArray());
        }

        private void DeleteReportLayout(string id)
        {
            List<SqlParameter> paras = new List<SqlParameter>();
            paras.Add(new SqlParameter("@layoutID", id));
            SqlHelper.ExecuteNonQuery(SqlHelper.GetConnection("SOHDB"), CommandType.StoredProcedure, "p_DeleteSAPReportLayout", paras.ToArray());
        }

        public class ReportFileData
        {
            public string FileName;
            public string FileDataBase64;
        }

        public class ReportLayoutData
        {
            public string Id;
            public string LayoutName;
            public string LayoutContent;
            public bool IsDefault;
        }

        class MasterData
        {
            public string Code { get; set; }
            public string Description { get; set; }
            public string RefCode { get; set; }

            public bool FilterPass(KendoFilter filter)
            {
                if (!filter.isValid) return true;

                var prop = this.GetType().GetProperty(filter.field);
                if (prop == null) return true;

                string value = prop.GetValue(this).ToString();
                if(filter.@operator == "eq")
                {
                    return value == filter.value;
                }
                else if(filter.@operator == "contains")
                {
                    if (string.IsNullOrEmpty(filter.value))
                    {
                        return true;
                    }
                    else if (filter.value.Contains("*"))
                    {
                        string valueTrimZero = value.TrimStart(' ', '0');
                        string pattern = Common.WildCardToRegular(filter.value);
                        return Regex.IsMatch(value, pattern) || Regex.IsMatch(valueTrimZero, pattern);
                    }
                    else
                        return value.IndexOf(filter.value, StringComparison.CurrentCultureIgnoreCase) >= 0;
                }
                else
                {
                    return true;
                }
            }

            public bool FilterPass(KendoFilterLevel2 filterSet)
            {
                if(filterSet.logic == "or")
                {
                    foreach(var filter in filterSet.filters)
                    {
                        if (FilterPass(filter))
                            return true;
                    }
                }
                else if(filterSet.logic == "and")
                {
                    foreach (var filter in filterSet.filters)
                    {
                        if (!FilterPass(filter))
                            return false;
                    }
                    return true;
                }

                return false;
            }

            public bool FilterPass(KendoFilterLevel3 filterSet)
            {
                if (filterSet.logic == "or")
                {
                    foreach (var filter in filterSet.filters)
                    {
                        if (FilterPass(filter))
                            return true;
                    }
                }
                else if (filterSet.logic == "and")
                {
                    foreach (var filter in filterSet.filters)
                    {
                        if (!FilterPass(filter))
                            return false;
                    }
                    return true;
                }

                return false;
            }
        }

        class MasterDataSet
        {
            public List<MasterData> ListData;
            public int TotalCount;

            public void ApplyPaging(int skip, int take)
            {
                if (skip > ListData.Count)
                {
                    ListData.Clear();
                    return;
                }

                ListData.RemoveRange(0, skip);
                
                if(ListData.Count > take)
                {
                    ListData.RemoveRange(take, ListData.Count - take);
                }
            }

            public void ApplyFilter(object filter)
            {
                if (filter == null) return;

                if(filter is KendoFilterLevel2)
                {
                    KendoFilterLevel2 filterSet = (KendoFilterLevel2)filter;
                    if(filterSet.isValid)
                    {
                        List<MasterData> newList = new List<MasterData>();
                        foreach(var md in ListData)
                        {
                            if (md.FilterPass(filterSet))
                                newList.Add(md);
                        }

                        ListData = newList;
                    }
                }
                if (filter is KendoFilterLevel3)
                {
                    KendoFilterLevel3 filterSet = (KendoFilterLevel3)filter;
                    if (filterSet.isValid)
                    {
                        List<MasterData> newList = new List<MasterData>();
                        foreach (var md in ListData)
                        {
                            if (md.FilterPass(filterSet))
                                newList.Add(md);
                        }

                        ListData = newList;
                    }
                }

                TotalCount = ListData.Count;
            }

            public List<int> GetIndice(List<string> codeList)
            {
                List<int> list = new List<int>();

                foreach (string code in codeList)
                {
                    for (int i = 0; i < ListData.Count; i++)
                    {
                        if (ListData[i].Code == code)
                        {
                            list.Add(i);
                            break;
                        }
                    }
                }

                return list;
            }
        }

        public class KendoFilter
        {
            public string field { get; set; }
            public string @operator { get; set; }
            public string value { get; set; }

            public bool isValid
            {
                get
                {
                    return !(string.IsNullOrEmpty(field) || string.IsNullOrEmpty(@operator));
                }
            }
        }

        public class KendoFilterLevel2
        {
            public string logic { get; set; }
            public List<KendoFilter> filters { get; set; }

            public bool isValid
            {
                get
                {
                    if (filters == null) return false;
                    foreach(var filter in filters)
                    {
                        if (filter.isValid == false)
                            return false;
                    }
                    return true;
                }
            }
        }

        public class KendoFilterLevel3
        {
            public string logic { get; set; }
            public List<KendoFilterLevel2> filters { get; set; }

            public bool isValid
            {
                get
                {
                    if (filters == null) return false;
                    foreach (var filter in filters)
                    {
                        if (filter.isValid == false)
                            return false;
                    }
                    return true;
                }
            }

            public static object Parse(string json)
            {
                if (string.IsNullOrEmpty(json))
                    return null;

                var filterSet = JsonConvert.DeserializeObject<KendoFilterLevel3>(json);
                if (filterSet.isValid)
                    return filterSet;

                var filterSet2 = JsonConvert.DeserializeObject<KendoFilterLevel2>(json);
                if (filterSet2.isValid)
                    return filterSet2;

                return null;
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