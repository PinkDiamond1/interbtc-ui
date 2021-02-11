import React, { ReactElement, useEffect, useState } from "react";
import { StoreType } from "../../types/util.types";
import { useSelector } from "react-redux";
import { dateToShortString } from "../../utils/utils";
import BN from "bn.js";
import Big from "big.js";
import * as constants from "../../../constants";
import { useTranslation } from "react-i18next";
import DashboardTable from "../dashboard-table/dashboard-table";

interface OracleInfo {
    id: string;
    source: string;
    feed: string;
    lastUpdate: string;
    exchangeRate: Big;
}

type OracleTableProps = {
    planckLocked: string;
};

export default function OracleTable(props: OracleTableProps): ReactElement {
    const [oracles, setOracles] = useState<Array<OracleInfo>>([]);
    const polkaBtcLoaded = useSelector((state: StoreType) => state.general.polkaBtcLoaded);
    const { t } = useTranslation();

    useEffect(() => {
        const fetchData = async () => {
            if (!polkaBtcLoaded) return;
            try {
                const oracle = await window.polkaBTC.oracle.getInfo();
                setOracles([
                    {
                        id: "0", // todo: if fetching multiple oracles: set to index, or get account_id
                        source: oracle.names.join(","),
                        feed: oracle.feed,
                        lastUpdate: dateToShortString(oracle.lastUpdate),
                        exchangeRate: oracle.exchangeRate,
                    },
                ]);
            } catch (e) {
                console.log(e);
            }
        };

        fetchData();
        const interval = setInterval(() => {
            fetchData();
        }, constants.COMPONENT_UPDATE_MS);
        return () => clearInterval(interval);
    }, [polkaBtcLoaded]);

    const tableHeadings = [
        <h1>{t("source")}</h1>,
        <h1>{t("feed")}</h1>,
        <h1>{t("last_update")}</h1>,
        <h1>{t("exchange_rate")}</h1>,
    ];

    const oracleTableRow = (oracle: OracleInfo): ReactElement[] => [
        <p>{oracle.source}</p>,
        <p>{oracle.feed}</p>,
        <p>{oracle.lastUpdate}</p>,
        <p> 1 BTC = {oracle.exchangeRate.toFixed(5)} DOT</p>,
    ];

    return (
        <div className={"dashboard-table-container " + (new BN(props.planckLocked) <= new BN(0) ? "oracle-space" : "")}>
            <div>
                <p className="table-heading">{t("dashboard.oracles.active_oracles")}</p>
            </div>
            <DashboardTable
                pageData={oracles}
                headings={tableHeadings}
                dataPointDisplayer={oracleTableRow}
                noDataEl={<td colSpan={4}>{t("no_oracles")}</td>}
            />
        </div>
    );
}
