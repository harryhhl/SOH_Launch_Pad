using KendoHelper;
using Newtonsoft.Json;
using NPOI.SS.UserModel;
using NPOI.XSSF.UserModel;
using System;
using System.Collections;
using System.Collections.Generic;
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
        public override async Task ProcessRequestAsync(HttpContext context)
        {
            if (HttpContext.Current.Request.HttpMethod == "POST")
            {
                string input;
                using (StreamReader reader = new StreamReader(context.Request.InputStream))
                {
                    input = reader.ReadToEnd();
                    await Common.APILogging(input, context);
                }

                var inputset = HttpUtility.ParseQueryString(input);
                var action = inputset.Get("Action");
                var token = inputset.Get("Token");
                var sysfuncid = inputset.Get("FuncID");
                var reportname = inputset.Get("Report");

                if (action == "new")
                {
                    var requestforQID = await GenericRequest.Post(Common.SapReportWSEndpointUrl + "AddReportQueue.ashx", new StringContent(input));

                    if (requestforQID.Status == RequestResult.ResultStatus.Failure)
                    {
                        context.Response.StatusCode = 400;
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
                    var result = await GenericRequest.Post(Common.SapReportWSEndpointUrl + "GetReportQueue.ashx", new StringContent(input));
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
                    var result = await GenericRequest.Post(Common.SapReportWSEndpointUrl + "GetReportConfig.ashx", new StringContent(input));
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
                    var result = await GenericRequest.Post(Common.SapReportWSEndpointUrl + "GetALVReportSchema.ashx", new StringContent(input));
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
                    var qid = inputset.Get("QID");
                    string rptdatajson = HttpContext.Current.Session["RptALV_" + qid] as string;
                    if (string.IsNullOrEmpty(rptdatajson))
                    {
                        var result = await GenericRequest.Post(Common.SapReportWSEndpointUrl + "GetALVReportData.ashx", new StringContent(input));
                        if (result.Status == RequestResult.ResultStatus.Failure)
                        {
                            context.Response.StatusCode = 400;
                            context.Response.StatusDescription = result.GetErrmsgTrim();
                            return;
                        }
                        else
                        {
                            rptdatajson = result.Data;
                            HttpContext.Current.Session["RptALV_" + qid] = rptdatajson;
                        }
                    }

                    string skip = inputset.Get("skip");
                    string take = inputset.Get("take");
                    string filter = inputset.Get("filter");
                    string sort = inputset.Get("sort");

                    if ((skip != null && take != null) || !string.IsNullOrEmpty(filter))
                    {
                        ReportDataSet rds = JsonConvert.DeserializeObject<ReportDataSet>(rptdatajson);

                        var filterSet = KendoFilterLevel3.Parse(filter);
                        rds.ApplyFilter(filterSet);
                        rds.ApplySort(KendoSort.Parse(sort));
                        rds.ApplyPaging(int.Parse(skip), int.Parse(take));

                        rptdatajson = JsonConvert.SerializeObject(rds);
                    }

                    context.Response.ContentType = "application/json";
                    context.Response.Write(rptdatajson);
                }
                else if (action == "getfiledata")
                {
                    var result = await GenericRequest.Post(Common.SapReportWSEndpointUrl + "GetFileReportData.ashx", new StringContent(input));
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
                        var result = await GenericRequest.Post(Common.SapReportWSEndpointUrl + "GetReportMaster.ashx", new StringContent(input));
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
                    var result = await GenericRequest.Post(Common.SapReportWSEndpointUrl + "GetReportMaster.ashx", new StringContent(input));
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
                else if (action == "getrptlayout" || action == "newrptlayout" || action == "updrptlayout" 
                          || action == "updrptlayoutdefault" || action == "delrptlayout")
                {
                    var result = await GenericRequest.Post(Common.SapReportWSEndpointUrl + "ReportLayout.ashx", new StringContent(input));
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
                else if (action == "downloadalvdata")
                {
                    var qid = inputset.Get("QID");
                    var layoutcontent = inputset.Get("LayoutContent");
                    string rptdatajson = HttpContext.Current.Session["RptALV_" + qid] as string;
                    if (string.IsNullOrEmpty(rptdatajson))
                    {
                        var result = await GenericRequest.Post(Common.SapReportWSEndpointUrl + "GetALVReportData.ashx", new StringContent(input));
                        if (result.Status == RequestResult.ResultStatus.Failure)
                        {
                            context.Response.StatusCode = 400;
                            context.Response.StatusDescription = result.GetErrmsgTrim();
                            return;
                        }
                        else
                        {
                            rptdatajson = result.Data;
                            HttpContext.Current.Session["RptALV_" + qid] = rptdatajson;
                        }
                    }

                    ReportDataSet rds = JsonConvert.DeserializeObject<ReportDataSet>(rptdatajson);
                    var layout = KendoGridLayout.FromJson(layoutcontent);

                    var rfd = ExportALVFile(rds, layout, reportname);

                    context.Response.ContentType = "application/json";
                    context.Response.Write(JsonConvert.SerializeObject(rfd));
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

        private List<ReportFileData> ExportALVFile(ReportDataSet reportDataSet, KendoGridLayout reportLayout, string reportname)
        {
            IWorkbook wb = new XSSFWorkbook();
            ISheet sheet = wb.CreateSheet();
            IDataFormat dataFormatCustom = wb.CreateDataFormat();
            var dateStyle = wb.CreateCellStyle();
            dateStyle.DataFormat = dataFormatCustom.GetFormat("yyyy-MM-dd");

            IRow header = sheet.CreateRow(0);

            XSSFCellStyle cellStyleHeader = (XSSFCellStyle)wb.CreateCellStyle();
            cellStyleHeader.FillForegroundColor = IndexedColors.LightTurquoise.Index;
            cellStyleHeader.FillPattern = FillPattern.SolidForeground;


            int colcount = 0;
            foreach(var column in reportLayout.Columns)
            {
                if (column.Hidden != null && column.Hidden == true) continue;
                ICell col = header.CreateCell(colcount);
                col.SetCellValue(column.Title);
                col.CellStyle = cellStyleHeader;
                colcount++;
            }

            for (int r = 0; r < reportDataSet.ListData.Count; r++)
            {
                IRow row = sheet.CreateRow(r + 1);
                colcount = 0;
                foreach (var column in reportLayout.Columns)
                {
                    if (column.Hidden != null && column.Hidden == true) continue;

                    ICell col = row.CreateCell(colcount);
                    string coln = column.Field;

                    var field = reportLayout.DataSource.Schema.Model.Fields[coln];

                    if (reportDataSet.ListData[r].ContainsKey(coln) && reportDataSet.ListData[r][coln] != null)
                        SetCellValue(col, reportDataSet.ListData[r][coln], field, dateStyle);
                    else
                        col.SetCellValue("");

                    colcount++;
                }
            }

            ReportFileData rfd = new ReportFileData();
            using (MemoryStream ms = new MemoryStream())
            {
                wb.Write(ms);

                string filename = $@"{reportname}_{DateTime.Now.ToString("yyyyMMddHHmm")}.xlsx";
                rfd.FileName = filename;
                rfd.FileDataBase64 = Convert.ToBase64String(ms.ToArray());
            }

            wb.Close();
            wb = null;

            List<ReportFileData> list = new List<ReportFileData>() { rfd };
            return list;
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
                    var ret = await GenericRequest.Post(Common.SapReportWSEndpointUrl + uri, content);
                }
            });            
        }

        private void SetCellValue(ICell cell, object val, Field f, ICellStyle dateStyle)
        {
            if (f != null && f.Type != null && f.Type == TypeEnum.Date)
            {
                DateTime dt = DateTime.Parse(val.ToString());
                cell.SetCellValue(dt);
                cell.CellStyle = dateStyle;
            }
            else if (f != null && f.Type != null && f.Type == TypeEnum.Number)
            {
                double num = 0.0f;
                double.TryParse(val.ToString(), out num);
                cell.SetCellValue(num);
            }
            else
            {
                cell.SetCellValue(val.ToString());
            }
        }
        

        class ReportData : Dictionary<string, object>
        {
            public bool FilterPass(KendoFilter filter)
            {
                if (!filter.isValid) return true;

                if (!this.ContainsKey(filter.field))
                    return false;

                object value = this[filter.field];
                return filter.DoCompare(value);
            }

            public bool FilterPass(KendoFilterLevel2 filterSet)
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

        class ReportDataSet
        {
            public List<ReportData> ListData = new List<ReportData>();
            public int TotalCount;

            public void ApplySort(KendoSort sort)
            {
                if (sort == null)
                    return;

                var cpr = (IComparer<ReportData>)new KendoSortComparer(sort.field);
                ListData.Sort(cpr);
                if (sort.dir == "desc")
                    ListData.Reverse();
            }

            public void ApplyPaging(int skip, int take)
            {
                if (skip > ListData.Count)
                {
                    ListData.Clear();
                    return;
                }

                ListData.RemoveRange(0, skip);

                if (ListData.Count > take)
                {
                    ListData.RemoveRange(take, ListData.Count - take);
                }
            }

            public void ApplyFilter(object filter)
            {
                if (filter == null) return;

                if (filter is KendoFilterLevel2)
                {
                    KendoFilterLevel2 filterSet = (KendoFilterLevel2)filter;
                    if (filterSet.isValid)
                    {
                        List<ReportData> newList = new List<ReportData>();
                        foreach (var md in ListData)
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
                        List<ReportData> newList = new List<ReportData>();
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
        }

        class KendoFilterComparer : IComparer
        {
            int IComparer.Compare(object a, object b)
            {
                decimal a_dec = 0;
                decimal b_dec = 0;
                if (decimal.TryParse(a.ToString(), out a_dec) && decimal.TryParse(b.ToString(), out b_dec))
                {
                    return a_dec.CompareTo(b_dec);
                }
                else
                    return a.ToString().CompareTo(b.ToString());
            }
        }

        class KendoSortComparer : IComparer<ReportData>
        {
            string checkfield;

            public KendoSortComparer(string cfield)
            {
                checkfield = cfield;
            }

            public int Compare(ReportData x, ReportData y)
            {
                object a_field = x[checkfield];
                object b_field = y[checkfield];

                var cpr = (IComparer)new KendoFilterComparer();
                return cpr.Compare(a_field, b_field);
            }
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

            public bool DoCompare(object targetValue)
            {
                IComparer cpr = (IComparer)new KendoFilterComparer();
                if (@operator == "eq")
                {
                    int r = cpr.Compare(targetValue, value);
                    return r == 0;
                }
                else if (@operator == "neq")
                {
                    int r = cpr.Compare(targetValue, value);
                    return r != 0;
                }
                else if (@operator == "gt")
                {
                    int r = cpr.Compare(targetValue, value);
                    return r == 1;
                }
                else if (@operator == "lt")
                {
                    int r = cpr.Compare(targetValue, value);
                    return r == -1;
                }
                else if (@operator == "gte")
                {
                    int r = cpr.Compare(targetValue, value);
                    return r == 1 || r == 0;
                }
                else if (@operator == "lte")
                {
                    int r = cpr.Compare(targetValue, value);
                    return r == -1 || r == 0;
                }
                else if (@operator == "isnull")
                {
                    return targetValue == null;
                }
                else if (@operator == "isnotnull")
                {
                    return targetValue != null;
                }
                else if (@operator == "isempty")
                {
                    return string.IsNullOrEmpty(targetValue.ToString());
                }
                else if (@operator == "isnotempty")
                {
                    return !string.IsNullOrEmpty(targetValue.ToString());
                }
                else if (@operator == "startswith")
                {
                    return targetValue.ToString().StartsWith(value);
                }
                else if (@operator == "doesnotstartwith")
                {
                    return !targetValue.ToString().StartsWith(value);
                }
                else if (@operator == "endswith")
                {
                    return targetValue.ToString().EndsWith(value);
                }
                else if (@operator == "doesnotendwith")
                {
                    return !targetValue.ToString().EndsWith(value);
                }
                else if (@operator == "contains")
                {
                    return targetValue.ToString().Contains(value);
                }
                else if (@operator == "doesnotcontain")
                {
                    return !targetValue.ToString().Contains(value);
                }

                return true;
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

        public class KendoSort
        {
            public string field { get; set; }
            public string dir { get; set; }

            public static KendoSort Parse(string json)
            {
                if (string.IsNullOrEmpty(json))
                    return null;

                var sort = JsonConvert.DeserializeObject<KendoSort[]>(json);
                if (sort.Length <= 0)
                    return null;
                else
                    return sort[0];
            }
        }

        internal class ReportFileData
        {
            public string FileName;
            public string FileDataBase64;
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