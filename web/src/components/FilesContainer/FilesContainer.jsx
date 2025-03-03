import React, { useState, useEffect } from 'react';
import { Link, useHistory } from 'react-router-dom';
import AuthWrapper from 'components/AuthWrapper';
import {
  string, number,
} from 'prop-types';
import { toastr } from 'react-redux-toastr';
import FilesTable from '../FilesTable/filesTable';
import filesContainerActions from './filesContainerActions';
import FilesApi from '../../apis/FilesApi.ts';
import ACCESS_LEVEL from 'domain/accessLevels';

const filesApi = new FilesApi();

const FilesContainer = ({
  projectId, path, urlBranch, defaultBranch, namespace, slug,
}) => {
  const history = useHistory();
  const [waiting, setWaiting] = useState(false);
  const [ahead, setAhead] = useState(0);
  const [behind, setBehind] = useState(0);
  const [files, setFiles] = useState([]);
  const finalBranch = urlBranch && urlBranch !== 'null' ? urlBranch : defaultBranch;

  useEffect(() => {
    if (projectId) {
      setWaiting(true);

      filesApi.getFilesPerProject(
        projectId,
        path,
        false,
        finalBranch,
      ).then((fs) => setFiles(fs))
        .catch(() => toastr.error('Error', 'Something went wrong getting files'))
        .finally(() => { setWaiting(false); });
    }

    if (!(defaultBranch === finalBranch)) {
      filesContainerActions.compareBranchesFunction(projectId, defaultBranch, finalBranch)
        .then(({ ahead: a, behind: b }) => {
          setAhead(a.length);
          setBehind(b.length);
        })
        .catch((err) => toastr.error('Error', err?.message));
    }
  }, [projectId, path, finalBranch, defaultBranch]);

  const hasChanges = !!(ahead || behind);

  return (
    <div className="files-container pt-3">
      {hasChanges && (
      <div className="commit-status">
        <p id="commitStatus">
          This branch is
          {' '}
          <b>
            {ahead}
            {' '}
            commit(s)
          </b>
          {' '}
          ahead and
          {' '}
          <b>
            {behind}
            {' '}
            commit(s)
          </b>
          {' '}
          behind
          {' '}
          <b>
            &quot;
            {defaultBranch}
            &quot;.
          </b>
        </p>
        <AuthWrapper minRole={ACCESS_LEVEL.DEVELOPER}>
          <Link
            type="button"
            className="btn btn-basic-dark btn-sm mr-2"
            to={`/${namespace}/${slug}/-/merge_requests/new?merge_request[source_branch]=${finalBranch}`}
          >
            Create merge request
          </Link>
        </AuthWrapper>
      </div>
      )}
      <FilesTable
        isReturnOptVisible={!!path}
        files={files.map((f) => ({ id: `${f.id} ${f.name}`, name: f.name, type: f.type }))}
        headers={['Name']}
        waiting={waiting}
        onClick={(e) => {
          const target = e?.currentTarget;
          const targetDataKey = target.getAttribute('data-key');
          const targetId = target.id;
          const file = files.filter((f) => `${f.id} ${f.name}` === targetId)[0];
          const baseLink = `/${namespace}/${slug}/-/${targetDataKey}`;
          if (!file) {
            toastr.error('Error', 'Something wrong browsing app');
            return;
          }
          const encodedPath = encodeURIComponent(file.path);
          const link = targetDataKey === 'tree'
            ? `${baseLink}/${finalBranch}/${encodedPath}`
            : `${baseLink}/branch/${finalBranch}/path/${encodedPath}`;
          history.push(link);
        }}
      />
    </div>
  );
};

FilesContainer.propTypes = {
  projectId: number.isRequired,
  path: string,
  urlBranch: string.isRequired,
  defaultBranch: string.isRequired,
};

FilesContainer.defaultProps = {
  path: '',
};

export default FilesContainer;
