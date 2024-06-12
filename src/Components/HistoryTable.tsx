import moment from 'moment';
import React from 'react';
import { GoChevronDown, GoChevronUp } from 'react-icons/go';
import { TiMinus } from 'react-icons/ti';
import { useSortBy, useTable } from 'react-table';

import { Clippy } from './Clippy';


interface Props {
  instances: any[];
}

const HistoryTable: React.FC<Props> = ({ instances }) => {
  const columns = React.useMemo(
    () => [
      {
        Header: 'State',
        accessor: 'state',
        Cell: ({ value }: any) => <Clippy value={value}>{value}</Clippy>,
      },
      {
        Header: 'Instance ID',

        Cell: ({ value }: any) => (
          <Clippy value={value}>
            <a href={`#/history/process-instance/${value}`}>{value}</a>
          </Clippy>
        ),
        accessor: 'id',
      },
      {
        Header: 'Start Time',
        accessor: 'startTime',
        Cell: ({ value }: any) => (
          <Clippy value={value ? value.format('YYYY-MM-DDTHH:mm:ss') : value}>
            {value ? value.format('YYYY-MM-DDTHH:mm:ss') : value}
          </Clippy>
        ),
      },
      {
        Header: 'End Time',
        accessor: 'endTime',
        Cell: ({ value }: any) => (
          <Clippy value={value ? value.format('YYYY-MM-DDTHH:mm:ss') : value}>
            {value ? value.format('YYYY-MM-DDTHH:mm:ss') : value}
          </Clippy>
        ),
      },
      {
        Header: 'Business Key',
        accessor: 'businessKey',
        Cell: ({ value }: any) => <Clippy value={value}>{value}</Clippy>,
      },
      {
        Header: 'Download',
        Cell: ({ row }: any) => {
          const handleDownload = async () => {
            try {
              const processInstanceId = row.values.id;
              await getDownloadS3Link(processInstanceId);
            } catch (error) {
              console.error('Error fetching download-s3 link:', error);
            }
          };
  
          return (
            <button onClick={handleDownload}>
              Download ZIP
            </button>
          );
        },
      },
    ],
    []
  );

  const data = React.useMemo(
    () =>
      instances.map((instance: any) => {
        return {
          state: instance.state,
          id: instance.id,
          businessKey: instance.businessKey,
          startTime: moment(instance.startTime),
          endTime: instance.endTime ? moment(instance.endTime) : '',
        };
      }),
    [instances]
  );

  const getDownloadS3Link = async (processInstanceId: string) => {
    if (processInstanceId) {  
      const response = await fetch(`/engine-rest/process-instance/${processInstanceId}/variables/download-s3`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      if (response.ok) {
        const data = await response.json();
        const downloadS3Link = data.value;
  
        if (downloadS3Link) {
          // Abrir link para download
          const link = document.createElement('a');
          link.href = downloadS3Link;
          link.setAttribute('download', '');
  
          document.body.appendChild(link);
          link.click();
  
          document.body.removeChild(link);
        } else {
          console.error('Failed to fetch download-s3 link');
        }
      } else {
        // Fetch variables for completed instances
        const response = await fetch(`/engine-rest/history/variable-instance?processInstanceId=${processInstanceId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
  
        if (response.ok) {
          const variables = await response.json();
          const downloadS3Variable = variables.find((variable: any) => variable.name === 'download-s3');
  
          if (downloadS3Variable) {
            const downloadS3Link = downloadS3Variable.value;
  
            if (downloadS3Link) {
              // Abrir link para download
              const link = document.createElement('a');
              link.href = downloadS3Link;
              link.setAttribute('download', '');
  
              document.body.appendChild(link);
              link.click();
  
              document.body.removeChild(link);
            } else {
              console.error('Failed to fetch download-s3 link');
            }
          } else {
            console.error('download-s3 variable not found');
          }
        } else {
          console.error('Error fetching variables:', response.status);
        }
      }
    } else {
      console.error('Process Instance ID is undefined');
    }
  };

  const tableInstance = useTable({ columns: columns as any, data }, useSortBy);
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance;
  return (
    <table className="cam-table" {...getTableProps()}>
      <thead>
        {headerGroups.map(headerGroup => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              /* @ts-ignore */
              <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                {column.render('Header')}
                <span style={{ position: 'absolute', fontSize: '125%' }}>
                  {
                    /* @ts-ignore */
                    column.isSorted ? (
                      /* @ts-ignore */
                      column.isSortedDesc ? (
                        <GoChevronDown style={{ color: '#155cb5' }} />
                      ) : (
                        <GoChevronUp style={{ color: '#155cb5' }} />
                      )
                    ) : (
                      <TiMinus style={{ color: '#155cb5' }} />
                    )
                  }
                </span>
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map(row => {
          prepareRow(row);
          return (
            <tr {...row.getRowProps()}>
              {row.cells.map(cell => {
                return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>;
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default HistoryTable;
