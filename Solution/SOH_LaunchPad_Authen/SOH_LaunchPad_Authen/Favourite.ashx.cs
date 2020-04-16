using System;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using System.Web;
using System.Data.SqlClient;
using System.Data;
using Newtonsoft.Json;
using Helper;

namespace SOH_LaunchPad_Authen
{
    /// <summary>
    /// Summary description for Favourite
    /// </summary>
    public class Favourite : IHttpHandler
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

                var inputset = HttpUtility.ParseQueryString(input);
                var action = inputset.Get("Action");
                var token = inputset.Get("Token");
                var sysfuncid = inputset.Get("FuncID");
                var username = inputset.Get("User");

                try
                {
                    if (action == "toggle")
                    {
                        List<SqlParameter> paras = new List<SqlParameter>();
                        paras.Add(new SqlParameter("@Username", username));
                        paras.Add(new SqlParameter("@SystemFuncID", sysfuncid));
                        SqlHelper.ExecuteNonQuery(SqlHelper.GetConnection("SOHDB"), CommandType.StoredProcedure, "p_ToggleFavor", paras.ToArray());

                        RequestResult result = new RequestResult();
                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(result));
                    }
                    else if (action == "updacess")
                    {
                        List<SqlParameter> paras = new List<SqlParameter>();
                        paras.Add(new SqlParameter("@Username", username));
                        paras.Add(new SqlParameter("@SystemFuncID", sysfuncid));
                        SqlHelper.ExecuteNonQuery(SqlHelper.GetConnection("SOHDB"), CommandType.StoredProcedure, "p_UpdateFuncAccess", paras.ToArray());

                        RequestResult result = new RequestResult();
                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(result));
                    }
                    else if (action == "getall")
                    {
                        FavourandFrequentList list = new FavourandFrequentList();
                        List<SqlParameter> paras = new List<SqlParameter>();
                        paras.Add(new SqlParameter("@Username", username));
                        DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("SOHDB"), CommandType.StoredProcedure, "p_GetFavourites", paras.ToArray());

                        for (int r = 0; r < rcd.Tables[0].Rows.Count; r++)
                        {
                            var row = rcd.Tables[0].Rows[r];
                            string funcId = row["FunctionID"].ToString();
                            list.FavorList.Add(funcId);
                        }

                        for (int r = 0; r < rcd.Tables[1].Rows.Count; r++)
                        {
                            var row = rcd.Tables[1].Rows[r];
                            string funcId = row["FunctionID"].ToString();
                            list.FrequentList.Add(funcId);
                        }

                        RequestResult result = new RequestResult();
                        result.Data = JsonConvert.SerializeObject(list);
                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(result));
                    }
                    else
                    {
                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(RequestResult.Error("No Action is defined")));
                    }
                }
                catch (Exception ex)
                {
                    context.Response.ContentType = "application/json";
                    context.Response.Write(JsonConvert.SerializeObject(RequestResult.Error(ex.Message)));
                }
            }
            else
            {
                context.Response.StatusCode = 405;
                context.Response.StatusDescription = "Sorry, only POST method allowed";
            }
        }

        public class FavourandFrequentList
        {
            public List<string> FavorList;
            public List<string> FrequentList;

            public FavourandFrequentList()
            {
                FavorList = new List<string>();
                FrequentList = new List<string>();
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