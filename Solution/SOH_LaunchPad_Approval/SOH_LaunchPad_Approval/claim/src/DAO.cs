using SAP.Middleware.Connector;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using SOH_LaunchPad_Approval.common;
using Newtonsoft.Json;
using System.Data;
using System.Reflection;
using System.Text.RegularExpressions;
using Helper;

namespace SOH_LaunchPad_Approval.claim.src
{
    public class DAO
    {
        public List<DataTable> List(string type, string docNo)
        {
            RfcDestination destination = SAPHelper.GetDest();

            RfcSessionManager.BeginContext(destination);
            try
            {
                RfcRepository sapRfcRepository = destination.Repository;

                IRfcFunction rfcFunction = sapRfcRepository.CreateFunction("ZBAPI_SOH_CLAIM_DISPLAY");
                rfcFunction.SetValue("I_Type", type.ToUpper());
                rfcFunction.SetValue("I_DOCNO", docNo.ToUpper());

                rfcFunction.Invoke(destination);

                IRfcStructure rs = rfcFunction.GetStructure("E_HEADER");
                var dHeader = SAPHelper.GetDataTableFromRfcStruct(rs);

                IRfcTable rtable = rfcFunction.GetTable("ET_DETAIL");
                var dDetail = SAPHelper.GetDataTableFromRfcTable(rtable);

                List<DataTable> list = new List<DataTable>();
                list.Add(dHeader);
                list.Add(dDetail);

                return list;
            }
            catch (Exception ex)
            {
                throw ex;
            }
            finally
            {
                RfcSessionManager.EndContext(destination);
            }
        }

        public bool CheckReleaseAuth(string userid, string type, string docNo)
        {
            var rs = GetReleaseStrg(type, docNo);
            bool Check_1 = Common.CheckAccessByClaimLevel(userid, "Approve_Claim_Level", rs.ClaimApproverLevel);

            return Check_1;
        }


        public ReleaseStrategy GetReleaseStrg(string type, string docNo)
        {
            RfcDestination destination = SAPHelper.GetDest();

            RfcSessionManager.BeginContext(destination);
            try
            {
                RfcRepository sapRfcRepository = destination.Repository;

                IRfcFunction rfcFunction = sapRfcRepository.CreateFunction("ZBAPI_SOH_CLAIM_KEY");
                rfcFunction.SetValue("I_Type", type.ToUpper());
                rfcFunction.SetValue("I_DOCNO", docNo.ToUpper());

                rfcFunction.Invoke(destination);
                var company = rfcFunction.GetString("E_BUKRS");
                var applevel = rfcFunction.GetString("E_LEVEL");
                var msg = rfcFunction.GetString("E_MESSAGE");

                if(msg.Length > 0)
                {
                    throw new Exception(msg);
                }
                else if(applevel == "0000")
                {
                    throw new Exception("Claim Level not maintained in CEN!");
                }

                ReleaseStrategy rs = new ReleaseStrategy();
                rs.ClaimApproverLevel = $@"{company}_{type}_{applevel}";
                

                return rs;
            }
            catch (Exception ex)
            {
                throw ex;
            }
            finally
            {
                RfcSessionManager.EndContext(destination);
            }
        }


        public List<ClaimApproveResult> Approve(string userid, ClaimApproveRst rst)
        {
            RfcDestination destination = SAPHelper.GetDest();

            RfcSessionManager.BeginContext(destination);
            try
            {
                RfcRepository sapRfcRepository = destination.Repository;

                IRfcFunction rfcFunction = sapRfcRepository.CreateFunction("ZBAPI_SOH_CLAIM_APPROVE");
                rfcFunction.SetValue("I_Type", rst.Type.ToUpper());
                rfcFunction.SetValue("I_DOCNO", rst.Doc.ToUpper());
                rfcFunction.SetValue("I_USERID", userid.ToUpper());

                rfcFunction.Invoke(destination);

                var msg = rfcFunction.GetString("E_MESSAGE");

                var msglist = new List<ClaimApproveResult>() { new ClaimApproveResult() { MESSAGE = msg } };

                return msglist;
            }
            catch (Exception ex)
            {
                throw ex;
            }
            finally
            {
                RfcSessionManager.EndContext(destination);
            }
        }

        public class ClaimApproveRst
        {
            public string Type;
            public string Doc;
        }

        public class ClaimApproveResult
        {
            public string MESSAGE;
        }

    }
}